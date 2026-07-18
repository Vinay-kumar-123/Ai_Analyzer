

import mongoose from "mongoose";
import { Worker } from "bullmq";
import dotenv from "dotenv";

import { connection, redis } from "../config/redis.js";
import Analysis from "../models/Analysis.js";
import User from "../models/User.js";
import UserAnalysis from "../models/UserAnalysis.js";
import connectDB from "../config/db.js";

import { runInitialAnalysis } from "../services/ai.service.js";

import {
  safeString,
  safeStringArray,
} from "../services/shared/normalizers.js";

import {
  MAX_VIDEO_DURATION_SECONDS,
  MAX_TRANSCRIPT_CHARS,
  AI_PIPELINE_TIMEOUT_MS,
  MESSAGES,
} from "../config/limits.js";

dotenv.config();
await connectDB();

// ── Wait for Redis ─────────────────────────────────────────────────────────────
await new Promise((resolve) => {
  const timeout = setTimeout(() => {
    console.warn("⚠️ Redis not connected after 10s — continuing anyway");
    resolve(false);
  }, 10000);

  if (redis.status === "ready") {
    clearTimeout(timeout);
    console.log("✅ Redis connected at startup");
    resolve(true);
  } else {
    redis.once("ready", () => {
      clearTimeout(timeout);
      console.log("✅ Redis connected");
      resolve(true);
    });
  }
});

console.log("🔥 Analysis Worker Started");

const WORKER_CONCURRENCY = 2;
const MAX_RETRY = 3;

// ── withTimeout ────────────────────────────────────────────────────────────────
const withTimeout = (promise, ms, label = "Operation") => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// ── Non-retryable error detection ──────────────────────────────────────────────
const isNonRetryable = (err) => {
  const msg = err?.message || "";
  return (
    msg === MESSAGES.TRANSCRIPT_TOO_LARGE ||
    msg === MESSAGES.TRANSCRIPT_TOO_SHORT  ||
    msg === MESSAGES.VIDEO_TOO_LONG        ||
    msg.includes("too dense")              ||
    msg.includes("too short")
  );
};

// ── updateProgress (non-fatal) ─────────────────────────────────────────────────
const updateProgress = async (analysisId, progress, extra = {}) => {
  try {
    await Analysis.findByIdAndUpdate(
      analysisId,
      { $set: { progress, ...extra } },
      { returnDocument: "after" },
    );
  } catch (err) {
    console.warn(`⚠️ Progress update failed for ${analysisId}:`, err.message);
  }
};

// ── Atomic credit deduction ────────────────────────────────────────────────────
const deductCredits = async (analysisId, session = null) => {
  const analysis = await Analysis.findById(analysisId)
    .select("creditsUsed")
    .session(session)
    .lean();

  if (!analysis) throw new Error("Analysis not found during credit deduction");

  const credits = analysis.creditsUsed || 1;

  // Find all UserAnalysis mappings linked to this analysis that are unpaid
  const unpaidMappings = await UserAnalysis.find({ analysis: analysisId, paid: false })
    .session(session);

  for (const mapping of unpaidMappings) {
    const updatedUser = await User.findOneAndUpdate(
      { _id: mapping.user, credits: { $gte: credits } },
      {
        $inc: { credits: -credits, totalRequests: 1, creditsUsed: credits },
        $set: { lastActivity: new Date() },
      },
      { returnDocument: "after", session },
    );

    if (!updatedUser) {
      console.warn(`User ${mapping.user} has insufficient credits during worker run — removing access`);
      await UserAnalysis.deleteOne({ _id: mapping._id }, { session });
      continue;
    }

    await UserAnalysis.updateOne(
      { _id: mapping._id },
      { $set: { paid: true } },
      { session },
    );

    console.log(`💳 Deducted ${credits} credits from user ${mapping.user}`);
  }
};

// ── Main job processor ─────────────────────────────────────────────────────────
const processJob = async (job) => {
  const start = Date.now();
  const { analysisId, userId, youtubeUrl, goal, language, credits } = job.data;

  console.log(
    `📦 Job: ${job.id} | analysisId: ${analysisId} | attempt: ${(job.attemptsMade ?? 0) + 1}`,
  );

  // Guard: already completed
  const existing = await Analysis.findById(analysisId)
    .select("status duration")
    .lean();

  if (!existing) throw new Error(`Analysis ${analysisId} not found`);

  if (existing.status === "completed") {
    console.log(`✅ Analysis ${analysisId} already completed — skipping`);
    return { success: true, skipped: true };
  }

  // Guard: video too long
  if (existing.duration && existing.duration > MAX_VIDEO_DURATION_SECONDS) {
    console.warn(`🚫 Rejecting oversized video: ${existing.duration}s`);
    await Analysis.findByIdAndUpdate(analysisId, {
      $set: {
        status: "failed",
        progress: 0,
        error: MESSAGES.VIDEO_TOO_LONG,
        completedAt: new Date(),
      },
    });
    return { success: false, reason: "video_too_long" };
  }

  // Mark processing
  await updateProgress(analysisId, 15, {
    status: "processing",
    startedAt: new Date(),
    error: "",
  });

  // Run initial analysis with retry
  let initialResult;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      console.log(`🧠 Initial analysis attempt ${attempt}/${MAX_RETRY}`);

      initialResult = await withTimeout(
        runInitialAnalysis({ youtubeUrl, goal, language }),
        AI_PIPELINE_TIMEOUT_MS,
        "Initial analysis pipeline",
      );

      break;
    } catch (err) {
      lastError = err;

      if (isNonRetryable(err)) {
        console.warn(`🚫 Non-retryable: ${err.message}`);
        await Analysis.findByIdAndUpdate(analysisId, {
          $set: {
            status: "failed",
            progress: 0,
            error: err.message,
            completedAt: new Date(),
          },
        });
        return { success: false, reason: "non_retryable", message: err.message };
      }

      console.warn(`⚠️ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_RETRY) await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }

  if (!initialResult) {
    throw new Error(`AI failed after ${MAX_RETRY} attempts: ${lastError?.message}`);
  }

  await updateProgress(analysisId, 85);

  const { transcript, ...normalizedSummary } = initialResult;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await Analysis.findByIdAndUpdate(
        analysisId,
        {
          $set: {
            contentType: safeString(normalizedSummary.contentType || "general").toLowerCase(),
            summary:     safeString(normalizedSummary.summary),
            outcome:     safeString(normalizedSummary.outcome),
            keyPoints:   safeStringArray(normalizedSummary.keyPoints).slice(0, 100),

            // CRITICAL: transcript saved here so all lazy routes can use it
            transcript:       transcript.slice(0, MAX_TRANSCRIPT_CHARS),
            transcriptLength: transcript.length,

            status:         "completed",
            progress:       100,
            completedAt:    new Date(),
            processingTime: Date.now() - start,
          },
        },
        { returnDocument: "after", session },
      );

      await deductCredits(analysisId, session);
    });
  } finally {
    await session.endSession();
  }

  console.log(`✅ Initial analysis saved for ${analysisId}`);

  const elapsed = Math.floor((Date.now() - start) / 1000);
  console.log(`🎉 Analysis ${analysisId} ready in ${elapsed}s`);

  return { success: true, elapsed };
};

// ── Worker instance ────────────────────────────────────────────────────────────
const worker = new Worker("analysis", processJob, {
  connection,
  concurrency:      WORKER_CONCURRENCY,
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 50  },
});

worker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", async (job, err) => {
  console.error(`❌ Job failed: ${job?.id} — ${err.message}`);

  const analysisId = job?.data?.analysisId;
  if (!analysisId) return;

  const isLastAttempt = (job.attemptsMade ?? 0) >= ((job.opts?.attempts ?? 1) - 1);

  if (isLastAttempt) {
    try {
      await Analysis.findByIdAndUpdate(analysisId, {
        $set: {
          status:      "failed",
          progress:    0,
          error:       err.message || "Unknown error",
          completedAt: new Date(),
        },
      });
      console.log(`📝 Analysis ${analysisId} marked as failed`);
    } catch (updateErr) {
      console.error(`❌ Could not mark ${analysisId} as failed:`, updateErr.message);
    }
  }
});

worker.on("error", (err) => {
  console.error("🚨 Worker-level error:", err.message);
  const isRedis = err.code === "EPIPE" || err.message?.includes("EPIPE") || err.message?.includes("ECONNREFUSED");
  if (isRedis) {
    console.error("   Redis broken — exiting for restart");
    process.exit(1);
  }
});

worker.on("stalled", (jobId) => {
  console.warn(`⚠️ Job stalled: ${jobId}`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`🛑 ${signal} — closing worker`);
  try { await worker.close(); console.log("✅ Worker closed"); }
  catch (err) { console.error("❌ Shutdown error:", err.message); }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught exception:", err.message);
  const isRedis = err.message?.includes("EPIPE") || err.message?.includes("ECONNREFUSED");
  if (isRedis) process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("🚨 Unhandled rejection:", reason);
});