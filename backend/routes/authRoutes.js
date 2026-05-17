import express from "express";

import rateLimit from "express-rate-limit";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getCurrentUser,
  logoutUser,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// RATE LIMITERS
// ======================================================

// ------------------------------------------------------
// LOGIN LIMITER
// ------------------------------------------------------

const loginLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 10,

    message: {
      success: false,

      message:
        "Too many login attempts. Try again later.",
    },

    standardHeaders: true,

    legacyHeaders: false,
  });

// ------------------------------------------------------
// REGISTER LIMITER
// ------------------------------------------------------

const registerLimiter =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    max: 5,

    message: {
      success: false,

      message:
        "Too many accounts created. Try later.",
    },

    standardHeaders: true,

    legacyHeaders: false,
  });

// ------------------------------------------------------
// REFRESH TOKEN LIMITER
// ------------------------------------------------------

const refreshLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 30,

    message: {
      success: false,

      message:
        "Too many refresh requests.",
    },
  });

// ======================================================
// HEALTH CHECK
// ======================================================

router.get(
  "/health",

  (req, res) => {

    res.status(200).json({
      success: true,

      message:
        "Auth API running",
    });
  }
);

// ======================================================
// AUTH ROUTES
// ======================================================

// ------------------------------------------------------
// REGISTER
// ------------------------------------------------------

router.post(
  "/register",

  registerLimiter,

  registerUser
);

// ------------------------------------------------------
// LOGIN
// ------------------------------------------------------

router.post(
  "/login",

  loginLimiter,

  loginUser
);

// ------------------------------------------------------
// REFRESH
// ------------------------------------------------------

router.post(
  "/refresh",

  refreshLimiter,

  refreshAccessToken
);

// ------------------------------------------------------
// LOGOUT
// ------------------------------------------------------

router.post(
  "/logout",

  protect,

  logoutUser
);

// ------------------------------------------------------
// CURRENT USER
// ------------------------------------------------------

router.get(
  "/me",

  protect,

  getCurrentUser
);

// ======================================================
// EXPORT
// ======================================================

export default router;