import mongoose from "mongoose";
import Joi from "joi";
import crypto from "crypto";

import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
import { analysisQueue } from "../queues/analysis.queue.js";

// ---------------- VALIDATION ----------------

const schema = Joi.object({
  youtubeUrl: Joi.string().uri().required(),
  language: Joi.string().valid("english", "hinglish").required(),
  goal: Joi.string().valid("student", "developer", "job_seeker").required(),
});

// ---------------- HELPERS ----------------

const estimateCreditsFromYoutube = () => 1;

// ---------------- CONTROLLER ----------------

export const createYoutubeAnalysis = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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

    // ✅ 2. GENERATE HASH (CRITICAL)
    const inputHash = crypto
      .createHash("sha256")
      .update(`${youtubeUrl}-${goal}-${language}`)
      .digest("hex");

    // ✅ 3. CHECK DUPLICATE (COST SAVING)
    const existing = await Analysis.findOne({
      user: userId,
      inputHash,
    });

    if (existing) {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message: "Using cached result",
        analysisId: existing._id,
      });
    }

    // ✅ 4. USER FETCH
    const user = await User.findById(userId).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    // ✅ 5. CREDIT CHECK
    const requiredCredits = estimateCreditsFromYoutube();

    if (user.credits < requiredCredits) {
      throw new Error("Insufficient credits");
    }

    // ✅ 6. CREATE ANALYSIS (QUEUED)
    const [analysis] = await Analysis.create(
      [
        {
          user: userId,
          youtubeUrl,
          language,
          goal,
          inputHash, // 🔥 FIXED
          status: "queued",
          creditsUsed: requiredCredits,
          videoTitle: "Queued for processing",
        },
      ],
      { session },
    );

    // ✅ 7. COMMIT TRANSACTION
    await session.commitTransaction();
    console.log("🚀 Adding job to queue:", analysis._id);
    // ✅ 8. ADD TO QUEUE
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
        jobId: analysis._id.toString(), // 🔥 duplicate prevent
        attempts: 3, // 🔥 retry
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true, // 🔥 memory cleanup
      },
    );
    console.log("🚀 Adding job to queue:", analysis._id);
    // ✅ 9. RESPONSE
    return res.status(202).json({
      success: true,
      message: "Analysis started successfully",
      analysisId: analysis._id,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
