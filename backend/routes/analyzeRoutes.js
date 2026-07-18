import express from "express";
import rateLimit from "express-rate-limit";
import {
  createYoutubeAnalysis,
  previewAnalysis,
  getAnalysisById,
  getUserAnalyses,
  getAnalysisStatus,
  deleteAnalysis,
  getNotes,
  getQuiz,
  getRoadmap,
} from "../controllers/analyzeController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Rate limiters ──────────────────────────────────────────────────────────────

// POST /youtube — creation is expensive, keep this strict
const createAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many analysis requests. Please slow down." },
});

// Status polling and history — generous limit for frontend polling loops
const pollingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many polling requests." },
});

// Lazy AI generation endpoints — per-minute window to prevent burst abuse
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many generation requests. Please wait a moment." },
});

// ── Routes ─────────────────────────────────────────────────────────────────────

// POST /api/analyze/youtube — create new AI analysis job
router.post("/youtube", protect, createAnalysisLimiter, createYoutubeAnalysis);

// GET /api/analyze/preview?url= — preview video metadata and credit cost
router.get("/preview", protect, previewAnalysis);

// GET /api/analyze/history — authenticated user analysis history
router.get("/history", protect, pollingLimiter, getUserAnalyses);

// GET /api/analyze/:id/status — lightweight status polling
router.get("/:id/status", protect, pollingLimiter, getAnalysisStatus);

// GET /api/analyze/:id — full analysis document
router.get("/:id", protect, pollingLimiter, getAnalysisById);

// DELETE /api/analyze/:id — delete owned analysis
router.delete("/:id", protect, pollingLimiter, deleteAnalysis);

// Lazy generation endpoints
router.get("/:id/notes",   protect, generationLimiter, getNotes);
router.get("/:id/quiz",    protect, generationLimiter, getQuiz);
router.get("/:id/roadmap", protect, generationLimiter, getRoadmap);

export default router;
