import mongoose from "mongoose";
import Joi from "joi";
import crypto from "crypto";

import { getVideoMeta } from "../utils/youtubeMeta.js";
import { calculateCredits } from "../utils/creditCalculator.js";

import User from "../models/User.js";
import Analysis from "../models/Analysis.js";

import { analysisQueue } from "../queues/analysis.queue.js";
import { getRedisClient } from "../config/redis.js";
import { extractVideoId } from "../utils/youtubeMeta.js";
import { CURRENT_AI_VERSION } from "../config/ai.js";
import UserAnalysis from "../models/UserAnalysis.js";

import { runLazyGeneration } from "../services/ai.service.js";
import { normalizeOutput }   from "../services/shared/content.normalizer.js";
import { executeGenerator }  from "../generators/generator.registry.js";

import {
  MAX_VIDEO_DURATION_SECONDS,
  MIN_VIDEO_DURATION_SECONDS,
  MAX_DAILY_ANALYSES,
  DAILY_LIMIT_TTL_SECS,
  ORPHAN_JOB_AGE_MS,
  MESSAGES,
} from "../config/limits.js";

// ======================================================
// VALIDATION
// ======================================================

const createAnalysisSchema = Joi.object({
  youtubeUrl: Joi.string().uri({ scheme: ["http", "https"] }).required(),

  language: Joi.string()
    .valid(
      "english", "hinglish", "hindi", "bengali", "tamil",
      "telugu", "marathi", "gujarati", "punjabi", "urdu",
      "malayalam", "kannada", "arabic", "spanish", "french",
      "german", "japanese", "korean", "chinese", "portuguese",
    )
    .required(),

  goal: Joi.string().valid("student", "developer", "job_seeker").required(),
});

// ======================================================
// HELPERS
// ======================================================

const normalizeLanguage = (lang) => {
  if (!lang) return "english";
  const l = lang.trim().toLowerCase();
  
  // English aliases
  if (l === "en" || l === "english" || l.startsWith("en-") || l === "eng") return "english";
  // Hindi aliases
  if (l === "hi" || l === "hindi" || l === "hin") return "hindi";
  // Hinglish aliases
  if (l === "hinglish" || l === "hin-eng") return "hinglish";
  // Bengali aliases
  if (l === "bengali" || l === "bn" || l === "ben") return "bengali";
  // Tamil aliases
  if (l === "tamil" || l === "ta" || l === "tam") return "tamil";
  // Telugu aliases
  if (l === "telugu" || l === "te" || l === "tel") return "telugu";
  // Marathi aliases
  if (l === "marathi" || l === "mr" || l === "mar") return "marathi";
  // Gujarati aliases
  if (l === "gujarati" || l === "gu" || l === "guj") return "gujarati";
  // Punjabi aliases
  if (l === "punjabi" || l === "pa" || l === "pan") return "punjabi";
  // Urdu aliases
  if (l === "urdu" || l === "ur" || l === "urd") return "urdu";
  // Malayalam aliases
  if (l === "malayalam" || l === "ml" || l === "mal") return "malayalam";
  // Kannada aliases
  if (l === "kannada" || l === "kn" || l === "kan") return "kannada";
  // Arabic aliases
  if (l === "arabic" || l === "ar" || l === "ara") return "arabic";
  // Spanish aliases
  if (l === "spanish" || l === "es" || l === "spa") return "spanish";
  // French aliases
  if (l === "french" || l === "fr" || l === "fre" || l === "fra") return "french";
  // German aliases
  if (l === "german" || l === "de" || l === "ger" || l === "deu") return "german";
  // Japanese aliases
  if (l === "japanese" || l === "ja" || l === "jpn") return "japanese";
  // Korean aliases
  if (l === "korean" || l === "ko" || l === "kor") return "korean";
  // Chinese aliases
  if (l === "chinese" || l === "zh" || l === "chi" || l === "zho") return "chinese";
  // Portuguese aliases
  if (l === "portuguese" || l === "pt" || l === "por") return "portuguese";

  return l;
};

// Cache identity definition: Video ID + Goal
const createInputHash = ({ youtubeUrl, goal }) => {
  const videoId = extractVideoId(youtubeUrl);
  const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;
  return crypto.createHash("sha256").update(`${normalizedUrl}-${goal}`).digest("hex");
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = seconds % 60;
  if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ""}`.trim();
  return `${s}s`;
};

const rollbackDailyLimit = (userId) => {
  const key = `daily_limit:${userId}:${new Date().toISOString().split("T")[0]}`;
  getRedisClient().decr(key).catch((err) => {
    console.warn("Daily limit rollback failed:", err.message);
  });
};

const checkAndIncrementDailyLimit = async (userId) => {
  const redis = getRedisClient();
  const key = `daily_limit:${userId}:${new Date().toISOString().split("T")[0]}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, DAILY_LIMIT_TTL_SECS);
  } else {
    // Fallback if process crashed before expire on first increment
    const ttl = await redis.ttl(key);
    if (ttl === -1) await redis.expire(key, DAILY_LIMIT_TTL_SECS);
  }
  
  if (count > MAX_DAILY_ANALYSES) {
    await redis.decr(key);
    return { allowed: false };
  }
  return { allowed: true };
};
const cleanOrphansGlobal = async (inputHash, language) => {
  try {
    const cutoff = new Date(Date.now() - ORPHAN_JOB_AGE_MS);
    await Analysis.updateMany(
      { inputHash, language, status: { $in: ["queued", "processing"] }, createdAt: { $lt: cutoff } },
      { $set: { status: "failed", error: "Orphaned job auto-cleaned" } },
    );
  } catch (err) {
    console.warn("Orphan cleanup failed:", err.message);
  }
};

const acquireCreateLock = async (inputHash, language) => {
  const lockKey = `lock:create:${inputHash}:${language}`;
  const redis = getRedisClient();
  let attempts = 0;
  while (attempts < 20) { // wait up to 10 seconds
    const acquired = await redis.set(lockKey, "1", "NX", "EX", 30);
    if (acquired) return lockKey;
    await new Promise((resolve) => setTimeout(resolve, 500));
    attempts++;
  }
  throw new Error("Timeout acquiring creation lock. Please try again.");
};
const linkUserToAnalysisAtomic = async (analysisId, userId, credits, skipDeduction = false) => {
  // 1. Check daily limit first
  const { allowed } = await checkAndIncrementDailyLimit(userId);
  if (!allowed) {
    const err = new Error(MESSAGES.DAILY_LIMIT_REACHED);
    err.status = 429;
    throw err;
  }

  let userDeducted = false;
  try {
    if (!skipDeduction) {
      // 2. Atomic credit deduction
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, credits: { $gte: credits } },
        {
          $inc: { credits: -credits, totalRequests: 1, creditsUsed: credits },
          $set: { lastActivity: new Date() },
        },
        { returnDocument: "after" }
      );

      if (!updatedUser) {
        const user = await User.findById(userId).select("credits").lean();
        const err = new Error(MESSAGES.INSUFFICIENT_CREDITS(credits, user?.credits ?? 0));
        err.status = 400;
        throw err;
      }
      userDeducted = true;
    }

    // 3. Link user to analysis mapping
    await UserAnalysis.findOneAndUpdate(
      { user: userId, analysis: analysisId },
      { $setOnInsert: { user: userId, analysis: analysisId, paid: !skipDeduction } },
      { upsert: true, returnDocument: "after" }
    );
  } catch (err) {
    // Rollback changes on failure
    if (userDeducted) {
      await User.updateOne(
        { _id: userId },
        { $inc: { credits: credits, totalRequests: -1, creditsUsed: -credits } }
      );
    }
    rollbackDailyLimit(userId);
    throw err;
  }
};

// ======================================================
// CREATE ANALYSIS
// POST /api/analyze/youtube
// ======================================================

export const createYoutubeAnalysis = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 🔥 Normalize language before Joi validation to handle aliases (EN, en-US, English -> english)
    if (req.body && req.body.language) {
      req.body.language = normalizeLanguage(req.body.language);
    }

    const { error, value } = createAnalysisSchema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.details?.[0]?.message || error.message });
    }

    const { youtubeUrl, language, goal } = value;

    // Normalize URL
    const videoId = extractVideoId(youtubeUrl);
    const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;
    
    // Cache identity base hash: Video ID + Goal
    const inputHash = createInputHash({ youtubeUrl: normalizedUrl, goal });

    // Stale processing recovery (language-aware)
    await cleanOrphansGlobal(inputHash, language);

    let lockKey;
    try {
      // 1. Initial fast check without lock (language-aware global check)
      let analysis = await Analysis.findOne({
        inputHash,
        language,
        aiVersion: CURRENT_AI_VERSION,
        status: { $in: ["completed", "queued", "processing"] },
      });

      if (!analysis) {
        lockKey = await acquireCreateLock(inputHash, language);
        // Double check after acquiring lock
        analysis = await Analysis.findOne({
          inputHash,
          language,
          aiVersion: CURRENT_AI_VERSION,
          status: { $in: ["completed", "queued", "processing"] },
        });
      }

      if (analysis) {
        if (lockKey) {
          const redis = getRedisClient();
          await redis.del(lockKey).catch(() => {});
        }

        // Track cache analytics for completed analyses
        if (analysis.status === "completed") {
          await Analysis.findByIdAndUpdate(analysis._id, {
            $inc: { cacheHits: 1 },
            $set: { lastAccessedAt: new Date() },
          });
        }

        // Re-use existing analysis
        const existingMapping = await UserAnalysis.findOne({ user: userId, analysis: analysis._id });
        if (!existingMapping) {
          // Verify daily limits, credits, and link them.
          // If analysis is already completed, deduct credits now. Otherwise, worker will deduct later.
          const isCompleted = analysis.status === "completed";
          await linkUserToAnalysisAtomic(analysis._id, userId, analysis.creditsUsed, !isCompleted);
        }

        const isCompleted = analysis.status === "completed";
        return res.status(200).json({
          success: true,
          cached: isCompleted,
          processing: !isCompleted,
          message: isCompleted ? "Using cached analysis" : "Analysis already in progress",
          analysisId: analysis._id,
          status: analysis.status,
        });
      }

      // Cache miss - we hold the lock, check user credits and daily limits
      const user = await User.findById(userId).select("credits").lean();
      if (!user) {
        throw new Error("User account not found");
      }

      // Metadata lookup
      let video;
      try {
        video = await getVideoMeta(normalizedUrl);
      } catch (err) {
        throw new Error(MESSAGES.VIDEO_UNAVAILABLE);
      }

      if (!video?.duration) {
        throw new Error(MESSAGES.VIDEO_UNAVAILABLE);
      }

      // Validate duration
      if (video.duration < MIN_VIDEO_DURATION_SECONDS) {
        const err = new Error(MESSAGES.VIDEO_TOO_SHORT);
        err.videoDuration = video.duration;
        err.durationFormatted = formatDuration(video.duration);
        err.status = 400;
        throw err;
      }

      if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
        const err = new Error(MESSAGES.VIDEO_TOO_LONG);
        err.videoDuration = video.duration;
        err.durationFormatted = formatDuration(video.duration);
        err.maxDuration = MAX_VIDEO_DURATION_SECONDS;
        err.status = 400;
        throw err;
      }

      const requiredCredits = calculateCredits(video.duration);
      if (user.credits < requiredCredits) {
        const err = new Error(MESSAGES.INSUFFICIENT_CREDITS(requiredCredits, user.credits));
        err.status = 400;
        throw err;
      }

      // Create the global Analysis document
      analysis = await Analysis.create({
        youtubeUrl: normalizedUrl,
        language,
        goal,
        inputHash,
        status: "queued",
        progress: 0,
        creditsUsed: requiredCredits,
        creditsDeducted: false,
        videoTitle: video.title || "",
        thumbnail: video.thumbnail || "",
        duration: video.duration || 0,
        aiVersion: CURRENT_AI_VERSION,
        cacheHits: 0,
        lastAccessedAt: new Date(),
      });

      // Create mapping (skip credit deduction for now since it will be run in worker on success)
      await linkUserToAnalysisAtomic(analysis._id, userId, requiredCredits, true);

      console.log(`📦 Analysis created: ${analysis._id} | duration: ${formatDuration(video.duration)}`);

      await analysisQueue.add(
        "youtube-analysis",
        {
          analysisId: analysis._id.toString(),
          youtubeUrl: normalizedUrl,
          language,
          goal,
          credits: requiredCredits,
        },
        {
          jobId: analysis._id.toString(),
          attempts: 3,
          backoff: { type: "exponential", delay: 30000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      );

      if (lockKey) {
        const redis = getRedisClient();
        await redis.del(lockKey).catch(() => {});
      }

      return res.status(202).json({
        success: true,
        cached: false,
        processing: true,
        message: MESSAGES.PROCESSING_STARTED,
        analysisId: analysis._id,
        status: "queued",
        video: {
          title: video.title || "",
          duration: video.duration || 0,
          durationFormatted: formatDuration(video.duration),
          thumbnail: video.thumbnail || "",
        },
      });
    } catch (err) {
      if (lockKey) {
        const redis = getRedisClient();
        await redis.del(lockKey).catch(() => {});
      }
      throw err;
    }
  } catch (err) {
    console.error("createYoutubeAnalysis error:", err.message);
    next(err);
  }
};

// ======================================================
// PREVIEW
// GET /api/analyze/preview?url=
// ======================================================

export const previewAnalysis = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string" || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return res.status(400).json({ success: false, message: MESSAGES.INVALID_URL });
    }

    let video;
    try {
      video = await getVideoMeta(url);
    } catch {
      return res.status(400).json({ success: false, message: MESSAGES.VIDEO_UNAVAILABLE });
    }

    if (!video?.duration) {
      return res.status(400).json({ success: false, message: MESSAGES.VIDEO_UNAVAILABLE, errorCode: "VIDEO_UNAVAILABLE" });
    }

    if (video.duration < MIN_VIDEO_DURATION_SECONDS) {
      return res.status(400).json({
        success: false, message: MESSAGES.VIDEO_TOO_SHORT, errorCode: "VIDEO_TOO_SHORT",
        videoDuration: video.duration, durationFormatted: formatDuration(video.duration),
      });
    }

    if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
      return res.status(400).json({
        success: false, message: MESSAGES.VIDEO_TOO_LONG, errorCode: "VIDEO_TOO_LONG",
        videoDuration: video.duration, durationFormatted: formatDuration(video.duration),
        maxDuration: MAX_VIDEO_DURATION_SECONDS,
      });
    }

    const requiredCredits = calculateCredits(video.duration);
    const user = await User.findById(req.user.id).select("credits").lean();
    const userCredits = user?.credits ?? 0;

    return res.status(200).json({
      success: true,
      requiredCredits, userCredits,
      canAnalyze: userCredits >= requiredCredits,
      video: {
        title: video.title || "",
        duration: video.duration || 0,
        durationFormatted: formatDuration(video.duration),
        thumbnail: video.thumbnail || "",
      },
    });
  } catch (err) {
    console.error("previewAnalysis error:", err.message);
    return res.status(500).json({ success: false, message: "Preview failed. Please try again." });
  }
};

// ======================================================
// GET ANALYSIS BY ID
// GET /api/analyze/:id
// ======================================================

export const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid analysis ID" });
    }

    const access = await UserAnalysis.findOne({ analysis: id, user: req.user.id });
    if (!access) {
      return res.status(404).json({ success: false, message: "Analysis not found or access denied" });
    }

    const analysis = await Analysis.findOne({ _id: id }).select("-transcript");

    if (!analysis) {
      return res.status(404).json({ success: false, message: "Analysis not found" });
    }

    return res.status(200).json({ success: true, data: analysis });
  } catch (err) {
    console.error("getAnalysisById error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve analysis" });
  }
};

// ======================================================
// GET ANALYSIS STATUS
// GET /api/analyze/:id/status
// ======================================================

export const getAnalysisStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid analysis ID" });
    }

    const access = await UserAnalysis.findOne({ analysis: id, user: req.user.id });
    if (!access) {
      return res.status(404).json({ success: false, message: "Analysis not found or access denied" });
    }

    const analysis = await Analysis.findOne(
      { _id: id },
      { status: 1, progress: 1, error: 1, completedAt: 1 },
    ).lean();

    if (!analysis) {
      return res.status(404).json({ success: false, message: "Analysis not found" });
    }

    return res.status(200).json({
      success: true,
      status: analysis.status,
      progress: analysis.progress,
      error: analysis.error || "",
      completedAt: analysis.completedAt || null,
    });
  } catch (err) {
    console.error("getAnalysisStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
};

// ======================================================
// GET USER ANALYSES (PAGINATED)
// GET /api/analyze/history
// ======================================================

export const getUserAnalyses = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip  = (page - 1) * limit;

    const mappings = await UserAnalysis.find({ user: req.user.id }).select("analysis").lean();
    const analysisIds = mappings.map((m) => m.analysis);

    const filter = { _id: { $in: analysisIds } };

    if (req.query.status) {
      const validStatuses = ["queued", "processing", "completed", "failed"];
      if (validStatuses.includes(req.query.status)) {
        filter.status = req.query.status;
      }
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const escaped = escapeRegExp(search);
      filter.$or = [
        { videoTitle: new RegExp(escaped, "i") },
        { summary:    new RegExp(escaped, "i") },
        { youtubeUrl: new RegExp(escaped, "i") },
        { contentType: new RegExp(escaped, "i") },
      ];
    }

    const allowedSortFields = ["createdAt", "updatedAt", "progress", "status", "duration"];
    const sortField     = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const sortDirection = req.query.sortOrder === "asc" ? 1 : -1;

    const [analyses, total] = await Promise.all([
      Analysis.find(filter)
        .select("-notes -transcript -sections")
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Analysis.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: analyses,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("getUserAnalyses error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve analyses" });
  }
};

// ======================================================
// DELETE
// DELETE /api/analyze/:id
// ======================================================

export const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid analysis ID" });
    }

    const access = await UserAnalysis.findOneAndDelete({ analysis: id, user: req.user.id });
    if (!access) {
      return res.status(404).json({ success: false, message: "Analysis not found or access denied" });
    }

    // Clean up global analysis if no other user is linked to it
    const remaining = await UserAnalysis.countDocuments({ analysis: id });
    if (remaining === 0) {
      await Analysis.deleteOne({ _id: id });
    }

    return res.status(200).json({ success: true, message: "Analysis deleted successfully" });
  } catch (err) {
    console.error("deleteAnalysis error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete analysis" });
  }
};

// ======================================================
// LAZY GENERATION INFRASTRUCTURE
// ======================================================

const getAnalysisForUser = async (id, userId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid analysis ID");
    err.status = 400;
    throw err;
  }

  const access = await UserAnalysis.findOne({ analysis: id, user: userId });

  if (!access) {
    const err = new Error("Analysis not found or access denied");
    err.status = 404;
    throw err;
  }

  const analysis = await Analysis.findById(id);

  if (!analysis) {
    const err = new Error("Analysis not found");
    err.status = 404;
    throw err;
  }

  return analysis;
};

/**
 * Maps each lazy part to its boolean flag field in the Analysis schema.
 */
const lazyFlagMap = {
  notes:      "notesGenerated",
  quiz:       "quizGenerated",
  roadmap:    "roadmapGenerated",
  flashcards: "flashcardsGenerated",
};

/**
 * The core content fields that must be non-empty to confirm a part is cached.
 * These are a secondary sanity check — the flag is the authoritative signal.
 */
const lazyCacheCheckFields = {
  notes:      ["notes"],
  quiz:       ["quiz"],
  roadmap:    ["roadmap"],
  flashcards: ["flashcards"],
};

const acquireLazyLock = async (analysisId, part) => {
  const lockKey = `analysis:${analysisId}:lazy:${part}`;
  const acquired = await getRedisClient().set(lockKey, "1", "NX", "EX", 180);
  if (!acquired) {
    const err = new Error("Generation already in progress for this content.");
    err.status = 429;
    throw err;
  }
  return lockKey;
};

const releaseLazyLock = async (lockKey) => {
  if (!lockKey) return;
  try { await getRedisClient().del(lockKey); } catch { /* ignore */ }
};

import { buildKnowledgeCoreFallback } from "../services/knowledge/knowledgeCore.builder.js";

const performLazyGeneration = async (analysis, part) => {
  if (!analysis.transcript?.trim()) {
    throw new Error(
      "Transcript data unavailable. Analysis may not have completed transcription. Please try again later.",
    );
  }

  const sourceMeta = {
    videoId:     extractVideoId(analysis.youtubeUrl) || "",
    videoTitle:  analysis.videoTitle || "",
    language:    analysis.language   || "english",
    duration:    analysis.duration   || 0,
  };

  let generatePromise;

  if (part === "flashcards") {
    // Knowledge Core Priority 1: Use stored knowledgeCore if present.
    // Knowledge Core Priority 2: Build IN-MEMORY non-persisted fallback knowledgeCore.
    // Knowledge Core Priority 3: Fall back to raw sections / transcript.
    const knowledgeCore = analysis.knowledgeCore || buildKnowledgeCoreFallback(analysis);
    const useSections   = !!(analysis.notesGenerated && analysis.sections?.length);

    generatePromise = executeGenerator("flashcards", {
      transcript:    analysis.transcript,
      goal:          analysis.goal,
      language:      analysis.language,
      sections:      analysis.sections || [],
      useSections,
      knowledgeCore,
    });
  } else {
    generatePromise = runLazyGeneration({
      transcript: analysis.transcript,
      goal:       analysis.goal,
      language:   analysis.language,
      part,
      sourceMeta,
    });
  }

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      const err = new Error("AI generation timeout. Please try again.");
      err.status = 408;
      reject(err);
    }, 120_000)
  );

  const raw = await Promise.race([generatePromise, timeoutPromise]);

  // Normalize exactly once here. Generators return raw output.
  return normalizeOutput(raw, sourceMeta);
};

const updateLazyContent = async (id, part, normalized) => {
  const updates = { [lazyFlagMap[part]]: true };

  if (part === "notes") {
    updates.learningObjectives = normalized.learningObjectives;
    updates.notes              = normalized.notes;
    updates.sections           = normalized.sections;
    if (normalized.knowledgeCore) {
      updates.knowledgeCore = normalized.knowledgeCore;
    }
  }

  if (part === "quiz") {
    updates.quiz = normalized.quiz;
  }

  if (part === "roadmap") {
    updates.roadmap       = normalized.roadmap;
    updates.learningPath  = normalized.learningPath;
    updates.executionPlan = normalized.executionPlan;
  }

  if (part === "flashcards") {
    updates.flashcards = normalized.flashcards;
  }

  return Analysis.findByIdAndUpdate(id, { $set: updates }, { returnDocument: "after" });
};

const getLazyHandler = (part) =>
  async (req, res) => {
    const { id } = req.params;

    try {
      let analysis;
      try {
        analysis = await getAnalysisForUser(id, req.user.id);
      } catch (err) {
        return res.status(err.status || 400).json({ success: false, message: err.message });
      }

      if (analysis.status !== "completed") {
        return res.status(409).json({
          success: false,
          message: "Analysis is still processing. Please wait until it completes.",
        });
      }

      const flagKey          = lazyFlagMap[part];
      const cacheCheckFields = lazyCacheCheckFields[part];

      const primaryHasContent = cacheCheckFields.every((field) => {
        const value = analysis[field];
        return Array.isArray(value) ? value.length > 0 : Boolean(value);
      });

      if (analysis[flagKey] && primaryHasContent) {
        return res.status(200).json({ success: true, generated: false, cached: true, data: analysis });
      }

      let lockKey;
      try {
        lockKey = await acquireLazyLock(id, part);
      } catch (err) {
        if (err.status === 429) res.setHeader("Retry-After", 10);
        return res.status(err.status || 429).json({ success: false, message: err.message });
      }

      try {
        const normalized = await performLazyGeneration(analysis, part);
        const refreshed  = await updateLazyContent(id, part, normalized);
        return res.status(200).json({ success: true, generated: true, data: refreshed });
      } catch (generationErr) {
        if (generationErr.status === 429 || generationErr.message?.includes("429")) {
          res.setHeader("Retry-After", 30);
          return res.status(429).json({
            success: false,
            message: "AI generation limit reached. Please try again in a few moments."
          });
        }
        throw generationErr;
      } finally {
        await releaseLazyLock(lockKey);
      }
    } catch (err) {
      console.error(`getLazyHandler(${part}) error:`, err.message);
      return res.status(500).json({ success: false, message: "Failed to retrieve requested content." });
    }
  };

// ======================================================
// LAZY ENDPOINT EXPORTS
// ======================================================

export const getNotes      = getLazyHandler("notes");
export const getQuiz       = getLazyHandler("quiz");
export const getRoadmap    = getLazyHandler("roadmap");
export const getFlashcards = getLazyHandler("flashcards");
