import Joi    from "joi";
import crypto  from "crypto";

import { getVideoMeta }      from "../utils/youtubeMeta.js";
import { calculateCredits }  from "../utils/creditCalculator.js";
import User                  from "../models/User.js";
import Analysis              from "../models/Analysis.js";
import { analysisQueue }     from "../queues/analysis.queue.js";
import { getRedisClient }    from "../config/redis.js";

// ======================================================
// CONSTANTS
// ======================================================

const MAX_DAILY_LIMIT      = 30;
const MAX_VIDEO_DURATION   = 60 * 60 * 6;   // 6 hours in seconds
const DAILY_LIMIT_TTL_SECS = 86400;          // 24 hours
const ORPHAN_AGE_MS        = 10 * 60 * 1000; // 10 minutes

// ======================================================
// VALIDATION SCHEMA
// ======================================================

const createAnalysisSchema = Joi.object({
  youtubeUrl: Joi.string().uri({ scheme: ["http", "https"] }).required(),
  language:   Joi.string().valid("english", "hinglish").required(),
  goal:       Joi.string().valid("student", "developer", "job_seeker").required(),
});

// ======================================================
// HELPERS
// ======================================================

const createInputHash = ({ youtubeUrl, goal, language }) =>
  crypto
    .createHash("sha256")
    .update(`${youtubeUrl}-${goal}-${language}`)
    .digest("hex");

// ── Atomic daily limit via Redis ──────────────────────
// Prevents race condition where two simultaneous requests
// both read "count = 29" and both pass the check.

const checkAndIncrementDailyLimit = async (userId) => {
  const redis  = getRedisClient();
  const today  = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const key    = `daily_limit:${userId}:${today}`;

  const count = await redis.incr(key);

  // Set expiry on first increment only (subsequent calls are no-ops if key exists)
  if (count === 1) {
    await redis.expire(key, DAILY_LIMIT_TTL_SECS);
  }

  if (count > MAX_DAILY_LIMIT) {
    // Roll back so we don't inflate the counter on rejected requests
    await redis.decr(key);
    return { allowed: false, count: count - 1 };
  }

  return { allowed: true, count };
};

// ── Orphan cleanup ────────────────────────────────────
// Reaps stuck "queued" records older than ORPHAN_AGE_MS
// so users don't get blocked by zombie jobs.

const cleanOrphans = async (userId, inputHash) => {
  try {
    const cutoff = new Date(Date.now() - ORPHAN_AGE_MS);
    await Analysis.updateMany(
      {
        user:      userId,
        inputHash,
        status:    "queued",
        createdAt: { $lt: cutoff },
      },
      {
        $set: { status: "failed", error: "Orphaned job — auto-cleaned" },
      }
    );
  } catch (err) {
    console.warn("⚠️ Orphan cleanup failed (non-critical):", err.message);
  }
};

// ======================================================
// CREATE ANALYSIS
// POST /api/analysis
// ======================================================

export const createYoutubeAnalysis = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ── 1. Validate input ────────────────────────────
    const { error, value } = createAnalysisSchema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details?.[0]?.message || error.message,
      });
    }

    const { youtubeUrl, language, goal } = value;

    // ── 2. Build input hash ──────────────────────────
    const inputHash = createInputHash({ youtubeUrl, goal, language });

    // ── 3. Clean orphaned jobs for this input ────────
    await cleanOrphans(userId, inputHash);

    // ── 4. Cache hit: completed result ───────────────
    const existingCompleted = await Analysis.findCached(userId, inputHash);

    if (existingCompleted) {
      return res.status(200).json({
        success:    true,
        cached:     true,
        processing: false,
        message:    "Using cached analysis result",
        analysisId: existingCompleted._id,
        status:     existingCompleted.status,
      });
    }

    // ── 5. Already running check ─────────────────────
    const existingRunning = await Analysis.findRunning(userId, inputHash);

    if (existingRunning) {
      return res.status(200).json({
        success:    true,
        cached:     false,
        processing: true,
        message:    "Analysis already in progress",
        analysisId: existingRunning._id,
        status:     existingRunning.status,
      });
    }

    // ── 6. Fetch user ────────────────────────────────
    const user = await User.findById(userId).select("credits").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    // ── 7. Atomic daily limit check (Redis) ──────────
    const { allowed, count } = await checkAndIncrementDailyLimit(userId);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: `Daily analysis limit of ${MAX_DAILY_LIMIT} reached`,
        resetAt: "midnight",
      });
    }

    // ── 8. Fetch video metadata ───────────────────────
    let video;
    try {
      video = await getVideoMeta(youtubeUrl);
    } catch (metaErr) {
      // Roll back daily counter since we're rejecting
      try { await getRedisClient().decr(`daily_limit:${userId}:${new Date().toISOString().split("T")[0]}`); } catch {}
      return res.status(400).json({
        success: false,
        message: "Unable to fetch video details. Ensure the URL is a valid public YouTube video.",
      });
    }

    if (!video || !video.duration) {
      try { await getRedisClient().decr(`daily_limit:${userId}:${new Date().toISOString().split("T")[0]}`); } catch {}
      return res.status(400).json({
        success: false,
        message: "Could not retrieve video duration. The video may be private or unavailable.",
      });
    }

    // ── 9. Video duration guard ───────────────────────
    if (video.duration > MAX_VIDEO_DURATION) {
      try { await getRedisClient().decr(`daily_limit:${userId}:${new Date().toISOString().split("T")[0]}`); } catch {}
      return res.status(400).json({
        success:       false,
        message:       "Video exceeds the 6-hour maximum duration",
        videoDuration: video.duration,
        maxDuration:   MAX_VIDEO_DURATION,
      });
    }

    // ── 10. Credit calculation ────────────────────────
    const requiredCredits = calculateCredits(video.duration);

    if (user.credits < requiredCredits) {
      try { await getRedisClient().decr(`daily_limit:${userId}:${new Date().toISOString().split("T")[0]}`); } catch {}
      return res.status(400).json({
        success:         false,
        message:         `Insufficient credits. You need ${requiredCredits} but have ${user.credits}.`,
        requiredCredits,
        userCredits:     user.credits,
      });
    }

    // ── 11. Create Analysis record ────────────────────
    const analysis = await Analysis.create({
      user:      userId,
      youtubeUrl,
      language,
      goal,
      inputHash,

      status:   "queued",
      progress: 0,

      creditsUsed:     requiredCredits,
      creditsDeducted: false,

      videoTitle: video.title     || "",
      thumbnail:  video.thumbnail || "",
      duration:   video.duration  || 0,

      error: "",
    });

    console.log(`🚀 Analysis created: ${analysis._id}`);

    // ── 12. Enqueue job ───────────────────────────────
    // jobId = analysisId → BullMQ deduplicates by jobId,
    // preventing double-queueing if the request is retried.
    await analysisQueue.add(
      "youtube-analysis",
      {
        analysisId: analysis._id,
        userId,
        youtubeUrl,
        language,
        goal,
        credits:    requiredCredits,
      },
      {
        jobId:    analysis._id.toString(),
        attempts: 3,
        backoff:  { type: "exponential", delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 50  },
      }
    );

    // ── 13. Response ──────────────────────────────────
    return res.status(202).json({
      success:    true,
      cached:     false,
      processing: true,
      message:    "AI analysis started successfully",
      analysisId: analysis._id,
      status:     "queued",
      requiredCredits,

      video: {
        title:     video.title     || "",
        duration:  video.duration  || 0,
        thumbnail: video.thumbnail || "",
      },
    });
  } catch (err) {
    console.error("❌ createYoutubeAnalysis error:", err.message);
    next(err);
  }
};

// ======================================================
// PREVIEW ANALYSIS
// GET /api/analysis/preview?url=...
// Returns credit cost and video info without creating a job.
// ======================================================

export const previewAnalysis = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'url' is required",
      });
    }

    // Loose URL sanity check before making external calls
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format",
      });
    }

    let video;
    try {
      video = await getVideoMeta(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Unable to fetch video details",
      });
    }

    if (!video || !video.duration) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL or video is unavailable",
      });
    }

    if (video.duration > MAX_VIDEO_DURATION) {
      return res.status(400).json({
        success:       false,
        message:       "Video exceeds the 6-hour maximum duration",
        videoDuration: video.duration,
        maxDuration:   MAX_VIDEO_DURATION,
      });
    }

    const requiredCredits = calculateCredits(video.duration);
    const user = await User.findById(req.user.id).select("credits").lean();
    const userCredits = user?.credits ?? 0;

    return res.status(200).json({
      success:        true,
      requiredCredits,
      userCredits,
      canAnalyze:     userCredits >= requiredCredits,
      video: {
        title:     video.title     || "",
        duration:  video.duration  || 0,
        thumbnail: video.thumbnail || "",
      },
    });
  } catch (err) {
    console.error("❌ previewAnalysis error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Preview failed. Please try again.",
    });
  }
};

// ======================================================
// GET ANALYSIS BY ID
// GET /api/analysis/:id
// ======================================================

export const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID",
      });
    }

    const analysis = await Analysis.findOne({
      _id:  id,
      user: req.user.id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data:    analysis,
    });
  } catch (err) {
    console.error("❌ getAnalysisById error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve analysis",
    });
  }
};

// ======================================================
// GET USER'S ANALYSIS LIST
// GET /api/analysis?page=1&limit=10
// Returns lightweight list — no notes/rawAI/actionEngine
// ======================================================

export const getUserAnalyses = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip  = (page - 1) * limit;

    const filter = { user: req.user.id };

    if (req.query.status) {
      const validStatuses = ["queued", "processing", "completed", "failed"];
      if (validStatuses.includes(req.query.status)) {
        filter.status = req.query.status;
      }
    }

    const [analyses, total] = await Promise.all([
      Analysis.find(filter)
        .select("-notes -rawAI -actionEngine -confusion -project -executionPlan -qa")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Analysis.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data:    analyses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext:    page * limit < total,
        hasPrev:    page > 1,
      },
    });
  } catch (err) {
    console.error("❌ getUserAnalyses error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve analyses",
    });
  }
};

// ======================================================
// DELETE ANALYSIS
// DELETE /api/analysis/:id
// ======================================================

export const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID",
      });
    }

    const analysis = await Analysis.findOneAndDelete({
      _id:  id,
      user: req.user.id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (err) {
    console.error("❌ deleteAnalysis error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete analysis",
    });
  }
};

// ======================================================
// GET ANALYSIS STATUS (lightweight poll endpoint)
// GET /api/analysis/:id/status
// Only returns status + progress — no full payload.
// Frontend polls this every few seconds during processing.
// ======================================================

export const getAnalysisStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID",
      });
    }

    const analysis = await Analysis.findOne(
      { _id: id, user: req.user.id },
      { status: 1, progress: 1, error: 1, completedAt: 1 }
    ).lean();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    return res.status(200).json({
      success:     true,
      status:      analysis.status,
      progress:    analysis.progress,
      error:       analysis.error || "",
      completedAt: analysis.completedAt || null,
    });
  } catch (err) {
    console.error("❌ getAnalysisStatus error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch status",
    });
  }
};