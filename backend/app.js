import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import mongoSanitize from "./middleware/mongoSanitize.js";


import hpp from "hpp";
import compression from "compression";

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorMiddleware.js";

import planRoutes from "./routes/planRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

//
// ======================================================
// DATABASE
// ======================================================
//

connectDB();

//
// ======================================================
// TRUST PROXY (important for production / Render / Railway / VPS)
// ======================================================
//

app.set("trust proxy", 1);

//
// ======================================================
// SECURITY
// ======================================================
//

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

//
// Prevent NoSQL Injection
//
app.use(mongoSanitize());


//
// Prevent HTTP Parameter Pollution
//
app.use(hpp());

//
// Compress API responses
//
app.use(compression());

//
// ======================================================
// CORS
// ======================================================
//

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS blocked: Origin not allowed")
      );
    },
    credentials: true,
  })
);

//
// ======================================================
// PARSERS
// ======================================================
//

app.use(cookieParser());

//
// Stripe/Razorpay webhook MUST come before express.json()
//

app.use(
  "/api/payment/webhook",
  express.raw({
    type: "application/json",
  })
);

//
// JSON body parser
//

app.use(
  express.json({
    limit: "30kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "30kb",
  })
);

//
// ======================================================
// RATE LIMITING
// ======================================================
//

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Please try again later." },
});

app.use(globalLimiter);

//
// ======================================================
// HEALTH CHECK
// ======================================================
//

app.get("/api/health", (req, res) => {
  const version =
    process.env.npm_package_version || process.env.APP_VERSION || null;

  const healthPayload = {
    success: true,
    status: "ok",
    message: "API running successfully",
    uptime: process.uptime(),
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
  };

  if (version) {
    healthPayload.version = version;
  }

  return res.status(200).json(healthPayload);
});

//
// ======================================================
// ROUTES
// ======================================================
//

app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/analyze", analyzeRoutes);

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/payment", paymentRoutes);

//
// ======================================================
// 404 HANDLER
// ======================================================
//

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

//
// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================
//

app.use(errorHandler);

export default app;