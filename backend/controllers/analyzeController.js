import Joi from "joi";
import crypto from "crypto";

import { getVideoMeta } from "../utils/youtubeMeta.js";
import { calculateCredits } from "../utils/creditCalculator.js";

import User from "../models/User.js";
import Analysis from "../models/Analysis.js";

import { analysisQueue } from "../queues/analysis.queue.js";
import { getRedisClient } from "../config/redis.js";

import { runLazyGeneration, normalizeOutput } from "../services/ai.service.js";

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
  youtubeUrl: Joi.string()
    .uri({
      scheme: ["http", "https"],
    })
    .required(),

  language: Joi.string()
    .valid(
      "english",
      "hinglish",
      "hindi",
      "bengali",
      "tamil",
      "telugu",
      "marathi",
      "gujarati",
      "punjabi",
      "urdu",
      "malayalam",
      "kannada",
      "arabic",
      "spanish",
      "french",
      "german",
      "japanese",
      "korean",
      "chinese",
      "portuguese"
    )
    .required(),

  goal: Joi.string()
    .valid(
      "student",
      "developer",
      "job_seeker"
    )
    .required(),
});

// ======================================================
// HELPERS
// ======================================================

const createInputHash = ({
  youtubeUrl,
  goal,
  language,
}) =>
  crypto
    .createHash("sha256")
    .update(
      `${youtubeUrl}-${goal}-${language}`
    )
    .digest("hex");

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatDuration = (seconds) => {
  const h = Math.floor(
    seconds / 3600
  );

  const m = Math.floor(
    (seconds % 3600) / 60
  );

  if (h > 0) {
    return `${h}h ${m}m`;
  }

  const s = seconds % 60;

  if (m > 0) {
    return `${m}m ${
      s > 0 ? `${s}s` : ""
    }`.trim();
  }

  return `${s}s`;
};

const rollbackDailyLimit = (
  userId
) => {
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const key = `daily_limit:${userId}:${today}`;

  getRedisClient()
    .decr(key)
    .catch((err) => {
      console.warn(
        "⚠️ Daily limit rollback failed:",
        err.message
      );
    });
};

const checkAndIncrementDailyLimit =
  async (userId) => {
    const redis =
      getRedisClient();

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const key = `daily_limit:${userId}:${today}`;

    const count =
      await redis.incr(key);

    if (count === 1) {
      await redis.expire(
        key,
        DAILY_LIMIT_TTL_SECS
      );
    }

    if (
      count >
      MAX_DAILY_ANALYSES
    ) {
      await redis.decr(key);

      return {
        allowed: false,
        count: count - 1,
      };
    }

    return {
      allowed: true,
      count,
    };
  };

const cleanOrphans = async (
  userId,
  inputHash
) => {
  try {
    const cutoff = new Date(
      Date.now() -
        ORPHAN_JOB_AGE_MS
    );

    await Analysis.updateMany(
      {
        user: userId,
        inputHash,
        status: "queued",

        createdAt: {
          $lt: cutoff,
        },
      },

      {
        $set: {
          status: "failed",
          error:
            "Orphaned job auto-cleaned",
        },
      }
    );
  } catch (err) {
    console.warn(
      "⚠️ Orphan cleanup failed:",
      err.message
    );
  }
};

// ======================================================
// CREATE ANALYSIS
// POST /api/analyze/youtube
// ======================================================

export const createYoutubeAnalysis =
  async (req, res, next) => {
    try {
      const userId =
        req.user.id;

      // ==============================================
      // VALIDATION
      // ==============================================

      const {
        error,
        value,
      } =
        createAnalysisSchema.validate(
          req.body,
          {
            abortEarly: true,
            stripUnknown: true,
          }
        );

      if (error) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              error.details?.[0]
                ?.message ||
              error.message,
          });
      }

      const {
        youtubeUrl,
        language,
        goal,
      } = value;

      // ==============================================
      // HASH
      // ==============================================

      const inputHash =
        createInputHash({
          youtubeUrl,
          goal,
          language,
        });

      // ==============================================
      // CLEAN ORPHANS
      // ==============================================

      await cleanOrphans(
        userId,
        inputHash
      );

      // ==============================================
      // COMPLETED CACHE
      // ==============================================

      const existingCompleted =
        await Analysis.findCached(
          userId,
          inputHash
        );

      if (existingCompleted) {
        return res
          .status(200)
          .json({
            success: true,
            cached: true,
            processing: false,

            message:
              "Using your previously completed analysis",

            analysisId:
              existingCompleted._id,

            status:
              existingCompleted.status,
          });
      }

      // ==============================================
      // RUNNING CACHE
      // ==============================================

      const existingRunning =
        await Analysis.findRunning(
          userId,
          inputHash
        );

      if (existingRunning) {
        return res
          .status(200)
          .json({
            success: true,
            cached: false,
            processing: true,

            message:
              "Analysis already in progress",

            analysisId:
              existingRunning._id,

            status:
              existingRunning.status,
          });
      }

      // ==============================================
      // USER
      // ==============================================

      const user =
        await User.findById(
          userId
        )
          .select("credits")
          .lean();

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "User account not found",
          });
      }

      // ==============================================
      // DAILY LIMIT
      // ==============================================

      const { allowed } =
        await checkAndIncrementDailyLimit(
          userId
        );

      if (!allowed) {
        return res
          .status(429)
          .json({
            success: false,

            message:
              MESSAGES.DAILY_LIMIT_REACHED,

            errorCode:
              "DAILY_LIMIT_REACHED",

            resetAt:
              "midnight",
          });
      }

      // ==============================================
      // VIDEO META
      // ==============================================

      let video;

      try {
        video =
          await getVideoMeta(
            youtubeUrl
          );
      } catch {
        rollbackDailyLimit(
          userId
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.VIDEO_UNAVAILABLE,

            errorCode:
              "VIDEO_UNAVAILABLE",
          });
      }

      if (
        !video ||
        !video.duration
      ) {
        rollbackDailyLimit(
          userId
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.VIDEO_UNAVAILABLE,

            errorCode:
              "VIDEO_UNAVAILABLE",
          });
      }

      // ==============================================
      // MIN DURATION
      // ==============================================

      if (
        video.duration <
        MIN_VIDEO_DURATION_SECONDS
      ) {
        rollbackDailyLimit(
          userId
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.VIDEO_TOO_SHORT,

            errorCode:
              "VIDEO_TOO_SHORT",

            videoDuration:
              video.duration,

            durationFormatted:
              formatDuration(
                video.duration
              ),

            minDuration:
              MIN_VIDEO_DURATION_SECONDS,
          });
      }

      // ==============================================
      // MAX DURATION
      // ==============================================

      if (
        video.duration >
        MAX_VIDEO_DURATION_SECONDS
      ) {
        rollbackDailyLimit(
          userId
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.VIDEO_TOO_LONG,

            errorCode:
              "VIDEO_TOO_LONG",

            videoDuration:
              video.duration,

            durationFormatted:
              formatDuration(
                video.duration
              ),

            maxDuration:
              MAX_VIDEO_DURATION_SECONDS,

            maxDurationLabel:
              "4 hours",
          });
      }

      // ==============================================
      // CREDIT CHECK
      // ==============================================

      const requiredCredits =
        calculateCredits(
          video.duration
        );

      if (
        user.credits <
        requiredCredits
      ) {
        rollbackDailyLimit(
          userId
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.INSUFFICIENT_CREDITS(
                requiredCredits,
                user.credits
              ),

            errorCode:
              "INSUFFICIENT_CREDITS",

            requiredCredits,

            userCredits:
              user.credits,
          });
      }

      // ==============================================
      // CREATE ANALYSIS
      // ==============================================

      const analysis =
        await Analysis.create({
          user: userId,

          youtubeUrl,

          language,

          goal,

          inputHash,

          status: "queued",

          progress: 0,

          creditsUsed:
            requiredCredits,

          creditsDeducted: false,

          videoTitle:
            video.title || "",

          thumbnail:
            video.thumbnail || "",

          duration:
            video.duration || 0,

          transcriptLength: 0,

          summary: "",

          notes: "",

          sections: [],

          keyPoints: [],

          roadmap: [],

          actionSteps: [],

          learningPath: [],

          qa: [],

          executionPlan: [],

          actionEngine: [],

          confusion: [],

          quiz: [],

          flashcards: [],

          rawAI: "",

          error: "",
        });

      console.log(
        `🚀 Analysis created: ${analysis._id} | duration: ${formatDuration(
          video.duration
        )}`
      );

      // ==============================================
      // ENQUEUE
      // ==============================================

      await analysisQueue.add(
        "youtube-analysis",

        {
          analysisId:
            analysis._id.toString(),

          userId:
            userId.toString(),

          youtubeUrl,

          language,

          goal,

          credits:
            requiredCredits,
        },

        {
          jobId:
            analysis._id.toString(),

          attempts: 3,

          backoff: {
            type: "exponential",
            delay: 3000,
          },

          removeOnComplete: {
            count: 100,
          },

          removeOnFail: {
            count: 50,
          },
        }
      );

      // ==============================================
      // RESPONSE
      // ==============================================

      return res
        .status(202)
        .json({
          success: true,

          cached: false,

          processing: true,

          message:
            MESSAGES.PROCESSING_STARTED,

          analysisId:
            analysis._id,

          status: "queued",

          video: {
            title:
              video.title || "",

            duration:
              video.duration || 0,

            durationFormatted:
              formatDuration(
                video.duration
              ),

            thumbnail:
              video.thumbnail ||
              "",
          },
        });
    } catch (err) {
      console.error(
        "❌ createYoutubeAnalysis error:",
        err.message,
        err.stack
      );

      next(err);
    }
  };

// ======================================================
// PREVIEW
// ======================================================

export const previewAnalysis =
  async (req, res) => {
    try {
      const { url } =
        req.query;

      if (
        !url ||
        typeof url !== "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.INVALID_URL,
          });
      }

      if (
        !url.startsWith(
          "http://"
        ) &&
        !url.startsWith(
          "https://"
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.INVALID_URL,
          });
      }

      let video;

      try {
        video =
          await getVideoMeta(
            url
          );
      } catch {
        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.VIDEO_UNAVAILABLE,
          });
      }

      if (
        !video ||
        !video.duration
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.VIDEO_UNAVAILABLE,

            errorCode:
              "VIDEO_UNAVAILABLE",
          });
      }

      if (
        video.duration <
        MIN_VIDEO_DURATION_SECONDS
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.VIDEO_TOO_SHORT,

            errorCode:
              "VIDEO_TOO_SHORT",

            videoDuration:
              video.duration,

            durationFormatted:
              formatDuration(
                video.duration
              ),
          });
      }

      if (
        video.duration >
        MAX_VIDEO_DURATION_SECONDS
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              MESSAGES.VIDEO_TOO_LONG,

            errorCode:
              "VIDEO_TOO_LONG",

            videoDuration:
              video.duration,

            durationFormatted:
              formatDuration(
                video.duration
              ),

            maxDuration:
              MAX_VIDEO_DURATION_SECONDS,

            maxDurationLabel:
              "4 hours",
          });
      }

      const requiredCredits =
        calculateCredits(
          video.duration
        );

      const user =
        await User.findById(
          req.user.id
        )
          .select("credits")
          .lean();

      const userCredits =
        user?.credits ?? 0;

      return res
        .status(200)
        .json({
          success: true,

          requiredCredits,

          userCredits,

          canAnalyze:
            userCredits >=
            requiredCredits,

          video: {
            title:
              video.title || "",

            duration:
              video.duration || 0,

            durationFormatted:
              formatDuration(
                video.duration
              ),

            thumbnail:
              video.thumbnail ||
              "",
          },
        });
    } catch (err) {
      console.error(
        "❌ previewAnalysis error:",
        err.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Preview failed. Please try again.",
        });
    }
  };

// ======================================================
// GET ANALYSIS
// ======================================================

export const getAnalysisById =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !id ||
        id.length !== 24
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid analysis ID",
          });
      }

      const analysis =
        await Analysis.findOne({
          _id: id,
          user: req.user.id,
        });

      if (!analysis) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Analysis not found or access denied",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          data: analysis,
        });
    } catch (err) {
      console.error(
        "❌ getAnalysisById error:",
        err.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to retrieve analysis",
        });
    }
  };

const lazyGenSchema = Joi.object({
  part: Joi.string()
    .valid(
      "notes",
      "quiz",
      "flashcards",
      "project",
      "roadmap"
    )
    .required(),
});

const getAnalysisForUser = async (id, userId) => {
  if (!id || id.length !== 24) {
    throw new Error("Invalid analysis ID");
  }

  const analysis = await Analysis.findOne({
    _id: id,
    user: userId,
  });

  if (!analysis) {
    const err = new Error("Analysis not found or access denied");
    err.status = 404;
    throw err;
  }

  return analysis;
};

const lazyFlagMap = {
  notes: "notesGenerated",
  quiz: "quizGenerated",
  flashcards: "flashcardsGenerated",
  project: "projectGenerated",
  roadmap: "roadmapGenerated",
};

/**
 * The PRIMARY fields that must be non-empty to consider a part "generated".
 * These are the fields the frontend actually consumes.
 *
 * IMPORTANT: Only list the CORE output fields here — NOT optional secondary
 * fields like learningPath, executionPlan, or qa.  Those are often empty
 * and must not gate the cache check.
 *
 * The generation flag (lazyFlagMap) is the authoritative signal.  These
 * fields are a secondary sanity-check for the case where the flag was set
 * but the write failed partway through.
 */
const lazyCacheCheckFields = {
  notes: ["notes"],
  quiz: ["quiz"],
  flashcards: ["flashcards"],
  project: ["project"],
  roadmap: ["roadmap", "actionSteps"],
};

/**
 * All fields written to MongoDB when a part is generated.
 * Includes secondary / optional fields that may or may not be populated
 * depending on AI output.
 */
const lazyUpdateFields = {
  notes: ["notes", "sections", "confusion"],
  quiz: ["quiz", "qa"],
  flashcards: ["flashcards"],
  project: ["project", "actionEngine"],
  roadmap: ["roadmap", "actionSteps", "learningPath", "executionPlan"],
};

const acquireLazyLock = async (analysisId, part) => {
  const redis = getRedisClient();
  const lockKey = `analysis:${analysisId}:lazy:${part}`;
  const acquired = await redis.set(lockKey, "1", "NX", "EX", 60);
  if (!acquired) {
    const err = new Error("Generation already in progress for this content.");
    err.status = 429;
    throw err;
  }
  return lockKey;
};

const releaseLazyLock = async (lockKey) => {
  if (!lockKey) return;
  try {
    await getRedisClient().del(lockKey);
        });
      }

      console.log(`${tag} status=${analysis.status}`);

      if (analysis.status !== "completed") {
        console.log(`${tag} ❌ 409 – analysis not completed`);
        return res.status(409).json({
          success: false,
          message: "Analysis is still processing. Please wait until it completes.",
        });
      }

      if (checkContent && checkContent(analysis) === false) {
        console.log(`${tag} ❌ 403 – content not available for this analysis`);
        return res.status(403).json({
          success: false,
          message: "Content is not available for this analysis.",
        });
      }

      const flagKey = lazyFlagMap[part];
      const cacheCheckFields = lazyCacheCheckFields[part];

      // ── DEBUG: show every field value that goes into the cache gate ────
      console.log(`${tag} flagKey="${flagKey}" value=${analysis[flagKey]}`);
      for (const field of cacheCheckFields) {
        const val = analysis[field];
        const len = Array.isArray(val) ? val.length : (val ? String(val).length : 0);
        console.log(`${tag}   cacheCheckField "${field}": isArray=${Array.isArray(val)} length=${len}`);
      }

      const primaryHasContent = cacheCheckFields.every((field) => {
        const value = analysis[field];
        return Array.isArray(value) ? value.length > 0 : Boolean(value);
      });

      console.log(`${tag} primaryHasContent=${primaryHasContent}  flagSet=${Boolean(analysis[flagKey])}`);

      if (analysis[flagKey] && primaryHasContent) {
        console.log(`${tag} ✅ CACHE HIT – returning cached data`);
        return res.status(200).json({
          success: true,
          generated: false,
          cached: true,
          data: analysis,
        });
      }

      console.log(`${tag} CACHE MISS – proceeding to generation`);

      // ── Acquire Redis lock ────────────────────────────────────────────
      let lockKey;
      try {
        lockKey = await acquireLazyLock(id, part);
        console.log(`${tag} 🔐 Lock acquired: ${lockKey}`);
      } catch (err) {
        console.log(`${tag} ❌ 429 from acquireLazyLock – lock already held: ${err.message}`);
        return res.status(err.status || 429).json({
          success: false,
          message: err.message,
        });
      }

      try {
        console.log(`${tag} 🤖 Starting Gemini generation`);
        const normalized = await performLazyGeneration(analysis, part);

        // ── DEBUG: show what the generator actually returned ──────────────
        for (const field of cacheCheckFields) {
          const val = normalized[field];
          const len = Array.isArray(val) ? val.length : (val ? String(val).length : 0);
          console.log(`${tag}   normalized["${field}"]: isArray=${Array.isArray(val)} length=${len}`);
        }

        console.log(`${tag} 💾 Saving to MongoDB`);
        const refreshed = await updateLazyContent(id, part, normalized);

        if (!refreshed) {
          console.log(`${tag} ❌ MongoDB save returned null – document not found?`);
        } else {
          console.log(`${tag} ✅ MongoDB save OK  ${flagKey}=${refreshed[flagKey]}`);
          // Verify cache fields after save
          for (const field of cacheCheckFields) {
            const val = refreshed[field];
            const len = Array.isArray(val) ? val.length : (val ? String(val).length : 0);
            console.log(`${tag}   saved["${field}"]: length=${len}`);
          }
        }

        return res.status(200).json({
          success: true,
          generated: true,
          data: refreshed,
        });
      } catch (generationErr) {
        console.log(`${tag} ❌ Generation error: ${generationErr.message}`);
        if (generationErr.status === 429 || generationErr.message?.includes("429")) {
          console.log(`${tag} ❌ 429 from Gemini/AI layer`);
          return res.status(429).json({
            success: false,
            message: "API rate limit reached. Please try again in a few moments.",
            retryAfter: generationErr.message?.match(/try again in ([\d.]+)s/)
              ? parseInt(generationErr.message.match(/try again in ([\d.]+)s/)[1]) + 5
              : 30,
          });
        }
        throw generationErr;
      } finally {
        await releaseLazyLock(lockKey);
        console.log(`${tag} 🔓 Lock released`);
        console.log(`${tag} ──────────────────────────────────────────\n`);
      }
    } catch (err) {
      console.error(`${tag} ❌ 500 unhandled: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve requested content.",
      });
    }
  };


export const getNotes = getLazyHandler("notes");
export const getQuiz = getLazyHandler("quiz");
export const getFlashcards = getLazyHandler("flashcards");
export const getProject = getLazyHandler("project", (analysis) => analysis.contentType === "tech");
export const getRoadmap = getLazyHandler("roadmap");

// ======================================================
// GET USER ANALYSES
// ======================================================

export const getUserAnalyses =
  async (req, res) => {
    try {
      const page =
        Math.max(
          1,
          parseInt(
            req.query.page,
            10
          ) || 1
        );

      const limit =
        Math.min(
          50,
          Math.max(
            1,
            parseInt(
              req.query.limit,
              10
            ) || 10
          )
        );

      const skip =
        (page - 1) * limit;

      const filter = {
        user: req.user.id,
      };

      if (
        req.query.status
      ) {
        const validStatuses =
          [
            "queued",
            "processing",
            "completed",
            "failed",
          ];

        if (
          validStatuses.includes(
            req.query.status
          )
        ) {
          filter.status =
            req.query.status;
        }
      }

      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : "";

      if (search) {
        const escaped = escapeRegExp(search);
        filter.$or = [
          { videoTitle: new RegExp(escaped, "i") },
          { summary: new RegExp(escaped, "i") },
          { youtubeUrl: new RegExp(escaped, "i") },
          { contentType: new RegExp(escaped, "i") },
        ];
      }

      const allowedSortFields = ["createdAt", "updatedAt", "progress", "status", "duration"];
      const sortField = allowedSortFields.includes(req.query.sortBy)
        ? req.query.sortBy
        : "createdAt";
      const sortDirection = req.query.sortOrder === "asc" ? 1 : -1;

      const [
        analyses,
        total,
      ] = await Promise.all([
        Analysis.find(
          filter
        )
          .select(`
            -notes
            -rawAI
            -actionEngine
            -confusion
            -project
            -executionPlan
            -qa
          `)
          .sort({
            [sortField]: sortDirection,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Analysis.countDocuments(
          filter
        ),
      ]);

      return res
        .status(200)
        .json({
          success: true,

          data: analyses,

          pagination: {
            total,

            page,

            limit,
            totalPages:
              Math.ceil(
                total / limit
              ),

            hasNext:
              page * limit <
              total,

            hasPrev:
              page > 1,
          },
        });
    } catch (err) {
      console.error(
        "❌ getUserAnalyses error:",
        err.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to retrieve analyses",
        });
    }
  };

// ======================================================
// DELETE
// ======================================================

export const deleteAnalysis =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !id ||
        id.length !== 24
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid analysis ID",
          });
      }

      const analysis =
        await Analysis.findOneAndDelete(
          {
            _id: id,
            user:
              req.user.id,
          }
        );

      if (!analysis) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Analysis not found or access denied",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Analysis deleted successfully",
        });
    } catch (err) {
      console.error(
        "❌ deleteAnalysis error:",
        err.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to delete analysis",
        });
    }
  };

// ======================================================
// STATUS
// ======================================================

export const getAnalysisStatus =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !id ||
        id.length !== 24
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid analysis ID",
          });
      }

      const analysis =
        await Analysis.findOne(
          {
            _id: id,
            user:
              req.user.id,
          },

          {
            status: 1,
            progress: 1,
            error: 1,
            completedAt: 1,
          }
        ).lean();

      if (!analysis) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Analysis not found",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          status:
            analysis.status,

          progress:
            analysis.progress,

          error:
            analysis.error ||
            "",

          completedAt:
            analysis.completedAt ||
            null,
        });
    } catch (err) {
      console.error(
        "❌ getAnalysisStatus error:",
        err.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to fetch status",
        });
    }
  };