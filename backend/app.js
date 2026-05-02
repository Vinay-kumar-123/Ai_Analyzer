import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

// ---------------- DB ----------------
connectDB();

// ---------------- TRUST PROXY ----------------
app.set("trust proxy", 1);

// ---------------- SECURITY ----------------
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// ---------------- PARSERS ----------------
app.use(cookieParser());

app.use(express.json({ limit: "30kb" }));
app.use(express.urlencoded({ extended: true, limit: "30kb" }));

// ---------------- RATE LIMIT ----------------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

app.use(globalLimiter);

// ---------------- ROUTES ----------------
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API running" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/analyze", analyzeRoutes); // ✅ only once
app.use("/api/dashboard", dashboardRoutes);

// ---------------- 404 ----------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ---------------- ERROR ----------------
app.use(errorHandler);

export default app;