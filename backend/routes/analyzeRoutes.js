import express from "express";
import {
  createYoutubeAnalysis,
  previewAnalysis,
  getAnalysisById,
} from "../controllers/analyzeController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

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
  createYoutubeAnalysis
);

/*
GET /api/analyze/preview?url=
Preview video + required credits before analysis
*/
router.get(
  "/preview",
  protect,
  previewAnalysis
);

/*
GET /api/analyze/:id
Fetch completed/processing analysis by ID
*/
router.get(
  "/:id",
  protect,
  getAnalysisById
);

export default router;