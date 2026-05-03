import Joi from "joi";
import crypto from "crypto";
import { getVideoMeta } from "../utils/youtubeMeta.js";
import { calculateCredits } from "../utils/creditCalculator.js";
import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
import { analysisQueue } from "../queues/analysis.queue.js";

// ---------------- VALIDATION ----------------

const schema = Joi.object({
  youtubeUrl: Joi.string().uri().required(),
  language: Joi.string().valid("english", "hinglish").required(),
  goal: Joi.string().valid("student", "developer", "job_seeker").required(),
});

// =======================================================
// 🚀 CREATE ANALYSIS (FINAL)
// =======================================================

export const createYoutubeAnalysis = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ✅ 1. VALIDATION
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const { youtubeUrl, language, goal } = value;

    // ✅ 2. GENERATE HASH (DEDUP)
    const inputHash = crypto
      .createHash("sha256")
      .update(`${youtubeUrl}-${goal}-${language}`)
      .digest("hex");

    // ✅ 3. CHECK EXISTING (CACHE HIT)
    const existing = await Analysis.findOne({
      user: userId,
      inputHash,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Using cached result",
        analysisId: existing._id,
      });
    }

    // ✅ 4. FETCH USER
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ 5. GET VIDEO META (CRITICAL)
    const video = await getVideoMeta(youtubeUrl);

    if (!video || !video.duration) {
      return res.status(400).json({
        success: false,
        message: "Unable to fetch video details",
      });
    }

    // ✅ 6. CALCULATE CREDITS (REAL LOGIC)
    const requiredCredits = calculateCredits(video.duration);

    // ✅ 7. CREDIT CHECK (FINAL AUTHORITY)
    if (user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        message: `You have ${user.credits} credits but this video requires ${requiredCredits} credits`,
        requiredCredits,
        userCredits: user.credits,
      });
    }

    // ✅ 8. CREATE ANALYSIS
    const analysis = await Analysis.create({
      user: userId,
      youtubeUrl,
      language,
      goal,
      inputHash,
      status: "queued",
      creditsUsed: requiredCredits,
      videoTitle: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
    });

    console.log("🚀 Adding job to queue:", analysis._id);

    // ✅ 9. ADD JOB (OPTIMIZED)
    await analysisQueue.add(
      "youtube-analysis",
      {
        analysisId: analysis._id,
        userId,
        youtubeUrl,
        language,
        goal,
        credits: requiredCredits,
      },
      {
        jobId: analysis._id.toString(), // prevent duplicate jobs
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
      }
    );

    // ✅ 10. RESPONSE
    return res.status(202).json({
      success: true,
      message: "Analysis started successfully",
      analysisId: analysis._id,
      requiredCredits,
    });

  } catch (error) {
    console.error("❌ Create Analysis Error:", error.message);
    next(error);
  }
};

// =======================================================
// 🔍 PREVIEW ANALYSIS (SMART UX)
// =======================================================

export const previewAnalysis = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // ✅ 1. GET VIDEO META
    const video = await getVideoMeta(url);

    if (!video || !video.duration) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL",
      });
    }

    // ✅ 2. CALCULATE REQUIRED CREDITS
    const requiredCredits = calculateCredits(video.duration);

    // ✅ 3. GET USER
    const user = await User.findById(req.user.id);

    return res.status(200).json({
      success: true,

      // 🔥 CORE DATA
      requiredCredits,
      userCredits: user?.credits || 0,
      canAnalyze: (user?.credits || 0) >= requiredCredits,

      // 🔥 VIDEO INFO
      video: {
        title: video.title,
        duration: video.duration,
        thumbnail: video.thumbnail,
      },
    });

  } catch (err) {
    console.error("❌ Preview Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Preview failed",
    });
  }
};