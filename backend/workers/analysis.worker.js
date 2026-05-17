import { Worker } from "bullmq";
import dotenv from "dotenv";

import { connection } from "../config/redis.js";
import Analysis       from "../models/Analysis.js";
import User           from "../models/User.js";
import { runAI }      from "../services/ai.service.js";
import connectDB      from "../config/db.js";

import {
  safeString,
  safeStringArray,
  safeQA,
  safeExecutionPlan,
  safeActionEngine,
  safeProject,
  safeArray,
  safeConfusion,
  validateAIResult,
} from "../services/ai.service.js";

// ======================================================
// BOOT
// ======================================================

dotenv.config();
await connectDB();
console.log("🔥 Analysis Worker Started");

// ======================================================
// CONFIG
// ======================================================

const MAX_RETRY      = 3;
const AI_TIMEOUT_MS  = 300000; // 5 min total pipeline timeout per attempt
const WORKER_CONCURRENCY = 2;

// ======================================================
// PROGRESS UPDATER
// Wraps findByIdAndUpdate with a no-throw guarantee —
// a failed progress update must never crash the worker.
// ======================================================

const updateProgress = async (analysisId, progress, extra = {}) => {
  try {
    await Analysis.findByIdAndUpdate(
      analysisId,
      { $set: { progress, ...extra } },
      { returnDocument: "after" }
    );
  } catch (err) {
    console.warn(`⚠️ Progress update failed for ${analysisId}:`, err.message);
    // intentionally swallowed — non-fatal
  }
};

// ======================================================
// PROGRESS TICKER
// Ticks the progress bar every N seconds while AI runs,
// giving the frontend a "living" progress indicator.
// Automatically stops when clearFn is called.
// ======================================================

const startProgressTicker = (analysisId, startPercent, endPercent, intervalMs = 9000) => {
  let current = startPercent;

  const interval = setInterval(async () => {
    if (current >= endPercent) {
      clearInterval(interval);
      return;
    }
    current = Math.min(current + 4, endPercent);
    await updateProgress(analysisId, current);
  }, intervalMs);

  return () => clearInterval(interval);
};

// ======================================================
// AI WITH TIMEOUT WRAPPER
// ======================================================

const withTimeout = (promise, ms, label = "Operation") => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// ======================================================
// AI RETRY WRAPPER
// ======================================================

const runAIWithRetry = async (payload) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      console.log(`🧠 AI attempt ${attempt}/${MAX_RETRY}`);
      const result = await withTimeout(runAI(payload), AI_TIMEOUT_MS, "Full AI pipeline");
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ AI attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_RETRY) {
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
  }

  throw new Error(`AI failed after ${MAX_RETRY} attempts: ${lastError.message}`);
};

// ======================================================
// SAFE CREDIT DEDUCTION (atomic, idempotent)
// ======================================================

const deductCredits = async (analysisId, userId, credits) => {
  // Guard: check if already deducted (re-entrant safety)
  const analysis = await Analysis.findById(analysisId).select("creditsDeducted").lean();
  if (!analysis) throw new Error("Analysis not found during credit deduction");
  if (analysis.creditsDeducted) {
    console.log("💡 Credits already deducted — skipping");
    return;
  }

  // Atomic deduction: only succeeds if user has enough credits
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: credits } },
    {
      $inc: {
        credits:       -credits,
        totalRequests: 1,
        creditsUsed:   credits,
      },
      $set: { lastActivity: new Date() },
    },
    { returnDocument: "after" }
  );

  if (!updatedUser) {
    throw new Error(
      `Credit deduction failed: user ${userId} may have insufficient credits (required: ${credits})`
    );
  }

  // Mark deducted in Analysis — separate write, idempotent
  await Analysis.findByIdAndUpdate(
    analysisId,
    { $set: { creditsDeducted: true } },
    { returnDocument: "after" }
  );

  console.log(`💳 Deducted ${credits} credits from user ${userId}`);
};

// ======================================================
// RESULT NORMALIZER
// Converts raw AI output into MongoDB-safe payload.
// All type coercions happen here — schema never sees raw AI.
// ======================================================

const buildFinalPayload = (aiResult, startTime) => ({
  // Scalar fields
  contentType: safeString(aiResult.contentType || "general").toLowerCase(),
  summary:     safeString(aiResult.summary),
  notes:       safeString(aiResult.notes),
  outcome:     safeString(aiResult.outcome),

  // String arrays
  keyPoints:    safeStringArray(aiResult.keyPoints).slice(0, 100),
  actionSteps:  safeStringArray(aiResult.actionSteps).slice(0, 100),
  roadmap:      safeStringArray(aiResult.roadmap).slice(0, 50),
  learningPath: safeStringArray(aiResult.learningPath),

  // Object arrays — fully normalized
  qa:            safeQA(aiResult.qa),
  executionPlan: safeExecutionPlan(aiResult.executionPlan),
  actionEngine:  safeActionEngine(aiResult.actionEngine),
  confusion:     safeConfusion(aiResult.confusion),
  timestamps:    safeArray(aiResult.timestamps),

  // Nested object
  project: safeProject(aiResult.project),

  // Raw AI — stored compressed, capped at 50K chars
  rawAI: JSON.stringify(aiResult).slice(0, 50000),

  // Status
  status:         "completed",
  progress:       100,
  completedAt:    new Date(),
  processingTime: Date.now() - startTime,
});

// ======================================================
// WORKER PROCESSOR
// ======================================================

const processJob = async (job) => {
  const start = Date.now();

  const {
    analysisId,
    userId,
    youtubeUrl,
    goal,
    language,
    credits,
  } = job.data;

  console.log(`📦 Job received: ${job.id} | analysisId: ${analysisId}`);

  // ── Guard: duplicate / stale job detection ──────────
  const existingAnalysis = await Analysis.findById(analysisId)
    .select("status creditsDeducted")
    .lean();

  if (!existingAnalysis) {
    throw new Error(`Analysis ${analysisId} not found — aborting job`);
  }

  if (existingAnalysis.status === "completed") {
    console.log(`✅ Analysis ${analysisId} already completed — skipping duplicate job`);
    return { success: true, skipped: true };
  }

  // ── Mark processing ──────────────────────────────────
  await updateProgress(analysisId, 10, {
    status:    "processing",
    startedAt: new Date(),
    error:     "",
  });

  // ── Start progress ticker (10% → 65% while AI runs) ─
  const stopTicker = startProgressTicker(analysisId, 10, 65, 9000);

  let aiResult;

  try {
    aiResult = await runAIWithRetry({ youtubeUrl, goal, language });
  } catch (err) {
    stopTicker();
    throw err; // re-throw to BullMQ for retry handling
  }

  stopTicker();

  // ── Validate output ──────────────────────────────────
  if (!validateAIResult(aiResult)) {
    throw new Error("AI output failed quality validation after all retries");
  }

  await updateProgress(analysisId, 70);

  // ── Build type-safe MongoDB payload ──────────────────
  const finalPayload = buildFinalPayload(aiResult, start);

  // ── Persist result ───────────────────────────────────
  await Analysis.findByIdAndUpdate(
    analysisId,
    { $set: finalPayload },
    { returnDocument: "after" }
  );

  await updateProgress(analysisId, 90);

  // ── Deduct credits (atomic, guarded) ─────────────────
  await deductCredits(analysisId, userId, credits);

  // ── Done ─────────────────────────────────────────────
  await updateProgress(analysisId, 100, { status: "completed", completedAt: new Date() });

  const elapsed = Math.floor((Date.now() - start) / 1000);
  console.log(`🎉 Analysis ${analysisId} completed in ${elapsed}s`);

  return { success: true, elapsed };
};

// ======================================================
// WORKER INSTANCE
// ======================================================

const worker = new Worker("analysis", processJob, {
  connection,
  concurrency: WORKER_CONCURRENCY,
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 50 },
});

// ======================================================
// WORKER EVENTS
// ======================================================

worker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", async (job, err) => {
  console.error(`❌ Job failed: ${job?.id} — ${err.message}`);

  const analysisId = job?.data?.analysisId;
  if (!analysisId) return;

  const isLastAttempt = (job.attemptsMade ?? 0) >= (job.opts?.attempts ?? 1);

  if (isLastAttempt) {
    try {
      await Analysis.findByIdAndUpdate(
        analysisId,
        {
          $set: {
            status:      "failed",
            progress:    0,
            error:       err.message || "Unknown error",
            completedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
      console.log(`📝 Analysis ${analysisId} marked as failed`);
    } catch (updateErr) {
      console.error(`❌ Failed to update analysis status for ${analysisId}:`, updateErr.message);
    }
  }
});

worker.on("error", (err) => {
  console.error("🚨 Worker-level error (non-job):", err.message);
  // Do NOT exit — let BullMQ recover. Log to monitoring.
});

worker.on("stalled", (jobId) => {
  console.warn(`⚠️ Job stalled: ${jobId}`);
});

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

const shutdown = async (signal) => {
  console.log(`🛑 ${signal} received — closing worker gracefully`);
  try {
    await worker.close();
    console.log("✅ Worker closed");
  } catch (err) {
    console.error("❌ Error during worker shutdown:", err.message);
  }
  process.exit(0);
};

process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err.message, err.stack);
  // Don't exit in production — log and continue
});

process.on("unhandledRejection", (reason) => {
  console.error("🚨 Unhandled Rejection:", reason);
});

export default worker;