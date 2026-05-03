import express from "express";
import { previewAnalysis } from "../controllers/analyzeController.js";
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
// routes/analyzeRoutes.js
router.get("/preview", protect, previewAnalysis);
router.post("/create", protect, createYoutubeAnalysis);


export default router;