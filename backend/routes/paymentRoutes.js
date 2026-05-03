// routes/paymentRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createOrder,
  verifyPayment,
} from "../controllers/paymentController.js";
import { razorpayWebhook } from "../controllers/webhookController.js";
const router = express.Router();
router.post(
  "/webhook",
  razorpayWebhook
);
router.post("/order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

export default router;