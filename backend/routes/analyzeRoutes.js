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
  getFlashcards,
  getProject,
  getRoadmap,
} from "../controllers/analyzeController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
// ─────────────────────────────────────────────────────────────
// ANALYSIS CREATION LIMITER
// ─────────────────────────────────────────────────────────────

const createAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many analysis requests. Please slow down.",
  },
});

// ─────────────────────────────────────────────────────────────
// POLLING LIMITER (SOFT)
// ─────────────────────────────────────────────────────────────

const pollingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many polling requests.",
  },
});

const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many generation requests. Please wait a moment.",
  },
});

/*
========================================
YouTube Analysis Routes
========================================
*/

/*
POST /api/analyze/youtube
Create new AI analysis job
*/
router.post(
  "/youtube",
  protect,
  createAnalysisLimiter,
  createYoutubeAnalysis
);

/*
GET /api/analyze/preview?url=
Preview video + required credits before analysis
*/
router.get("/preview", protect, previewAnalysis);

/*
GET /api/analyze/history
Fetch authenticated user's analysis history
*/
router.get(
  "/history",
  protect,
  pollingLimiter,
  getUserAnalyses
);

/*
GET /api/analyze/:id/status
Fetch only polling status fields for an analysis
*/
router.get(
  "/:id/status",
  protect,
  pollingLimiter,
  getAnalysisStatus
);

/*
GET /api/analyze/:id
Fetch completed/processing analysis by ID
*/
router.get(
  "/:id",
  protect,
  pollingLimiter,
  getAnalysisById
);

/*
DELETE /api/analyze/:id
Delete an owned analysis
*/
router.delete(
  "/:id",
  protect,
  pollingLimiter,
  deleteAnalysis
);

router.get(
  "/:id/notes",
  protect,
  generationLimiter,
  getNotes
);

router.get(
  "/:id/quiz",
  protect,
  generationLimiter,
  getQuiz
);

router.get(
  "/:id/flashcards",
  protect,
  generationLimiter,
  getFlashcards
);

router.get(
  "/:id/project",
  protect,
  generationLimiter,
  getProject
);

router.get(
  "/:id/roadmap",
  protect,
  generationLimiter,
  getRoadmap
);

export default router;
