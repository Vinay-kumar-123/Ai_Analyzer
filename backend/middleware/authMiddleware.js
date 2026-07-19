import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ---------------- AUTH PROTECT ----------------

export const protect = async (req, res, next) => {
  try {
    let accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // ❌ No tokens at all
    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token found",
      });
    }

    let decoded;

    try {
      // ✅ Try access token first
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (err) {
      // 🔁 If access expired → try refresh token
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again",
        });
      }

      try {
        const refreshDecoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );

        const user = await User.findById(refreshDecoded.id);

        if (!user || user.refreshToken !== refreshToken) {
          return res.status(401).json({
            success: false,
            message: "Invalid session. Please login again",
          });
        }

        // 🔥 Generate new access token (ROTATION)
        const newAccessToken = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        // 🍪 Set new cookie
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          maxAge: 15 * 60 * 1000,
        });

        decoded = {
          id: user._id,
          role: user.role,
        };
      } catch (refreshErr) {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again",
        });
      }
    }

    // ✅ FINAL USER CHECK (select credits and creditsExpiry for expiry resolution)
    const user = await User.findById(decoded.id).select(
      "_id role credits creditsExpiry"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // 🔥 Dynamic credit expiry check & reset (on-demand database update)
    if (user.creditsExpiry && new Date() > user.creditsExpiry && user.credits > 0) {
      user.credits = 0;
      await User.updateOne({ _id: user._id }, { $set: { credits: 0 } });
    }

    // ✅ Attach user to request
    req.user = {
      id: user._id,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// ---------------- ROLE BASED ACCESS ----------------

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    next();
  };
};