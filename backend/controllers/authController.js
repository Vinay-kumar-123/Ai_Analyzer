import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * POST /api/auth/google
 * Google OAuth 2.0 / OpenID Connect ID Token authentication endpoint.
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google ID Token is required",
      });
    }

    // Verify token signature, audience, issuer, and expiration via Google public keys
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      console.error("Google Token Verification Failed:", verifyErr.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google ID Token",
      });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token payload",
      });
    }

    const { sub, email, name, picture, email_verified } = payload;

    if (!email || !email_verified) {
      return res.status(400).json({
        success: false,
        message: "Unverified Google email address",
      });
    }

    // 1. Lookup priority: Permanent Google Subject ID (sub)
    let user = await User.findOne({ googleId: sub });

    // 2. Safe Account Linking Migration: Match existing user by verified email
    if (!user) {
      const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
      if (existingEmailUser) {
        if (!existingEmailUser.googleId) {
          existingEmailUser.googleId = sub;
          existingEmailUser.picture = picture || existingEmailUser.picture;
          existingEmailUser.provider = "google";
          existingEmailUser.emailVerified = true;
          existingEmailUser.lastLogin = new Date();
          // Existing accounts already received initial credits
          existingEmailUser.welcomeCreditsGiven = true;
          await existingEmailUser.save();
          user = existingEmailUser;
        } else {
          return res.status(400).json({
            success: false,
            message: "Email is associated with another Google account.",
          });
        }
      }
    }

    // 3. Create New User if no record matches
    if (!user) {
      user = await User.create({
        name: name || "User",
        email: email.toLowerCase(),
        googleId: sub,
        picture: picture || null,
        provider: "google",
        emailVerified: true,
        welcomeCreditsGiven: false,
        credits: 0, // Granted atomically below
        lastLogin: new Date(),
      });
    } else {
      // Update lastLogin & refresh profile info
      user.lastLogin = new Date();
      if (picture && user.picture !== picture) user.picture = picture;
      if (name && user.name !== name && user.name === "User") user.name = name;
      await user.save();
    }

    // 4. Atomic Welcome Credit Assignment (Granted ONLY ONCE)
    if (!user.welcomeCreditsGiven) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, welcomeCreditsGiven: false },
        {
          $inc: { credits: 10 },
          $set: { welcomeCreditsGiven: true },
        },
        { new: true }
      );
      if (updatedUser) {
        user = updatedUser;
      }
    }

    // Dynamic credit expiry check & reset on login
    if (user.creditsExpiry && new Date() > user.creditsExpiry && user.credits > 0) {
      user.credits = 0;
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        credits: user.credits,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role = "student" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      credits: 10,
      welcomeCreditsGiven: true,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.password) {
      const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
      );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    // Dynamic credit expiry check & reset on login
    if (user.creditsExpiry && new Date() > user.creditsExpiry && user.credits > 0) {
      user.credits = 0;
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        credits: user.credits,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.cookie(
      "accessToken",
      newAccessToken,
      accessCookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Access token refreshed",
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const user = await User.findOne({
        refreshToken,
      });

      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie("accessToken", accessCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};