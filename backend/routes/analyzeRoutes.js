import express from "express";

import {
  createYoutubeAnalysis,
} from "../controllers/analyzeController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


// Create YouTube Analysis
router.post(
  "/youtube",
  protect,
  createYoutubeAnalysis
);

export default router;