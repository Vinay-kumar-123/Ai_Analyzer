import express from "express";
import rateLimit from "express-rate-limit";
import {
  googleAuth,
  registerUser,
  loginUser,
  refreshAccessToken,
  getCurrentUser,
  logoutUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// RATE LIMITERS
// ======================================================

const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many Google authentication attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many accounts created. Try later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many refresh requests.",
  },
});

// ======================================================
// HEALTH CHECK
// ======================================================

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth API running",
  });
});

// ======================================================
// AUTH ROUTES
// ======================================================

// ------------------------------------------------------
// GOOGLE OAUTH
// ------------------------------------------------------

router.post("/google", googleLimiter, googleAuth);

// ------------------------------------------------------
// LEGACY REGISTER / LOGIN (Kept for rollback capability)
// ------------------------------------------------------

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);

// ------------------------------------------------------
// REFRESH / LOGOUT / CURRENT USER
// ------------------------------------------------------

router.post("/refresh", refreshLimiter, refreshAccessToken);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getCurrentUser);

export default router;