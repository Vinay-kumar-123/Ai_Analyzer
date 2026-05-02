import express from "express";

import {
  getDashboardStats,
  getCreditBalance,
  getAnalysisHistory,
  getSingleAnalysis,
  deleteAnalysis,
} from "../controllers/dashboardController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


// Dashboard overview stats
router.get(
  "/stats",
  protect,
  getDashboardStats
);


// Current credit balance
router.get(
  "/credits",
  protect,
  getCreditBalance
);


// Full analysis history
router.get(
  "/history",
  protect,
  getAnalysisHistory
);


// Single analysis details
router.get(
  "/history/:id",
  protect,
  getSingleAnalysis
);


// Delete analysis
router.delete(
  "/history/:id",
  protect,
  deleteAnalysis
);

export default router;