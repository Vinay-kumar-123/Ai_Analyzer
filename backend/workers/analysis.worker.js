import { Worker } from "bullmq";
import { connection } from "../config/redis.js";
import Analysis from "../models/Analysis.js";
import User from "../models/User.js";
import { runAI } from "../services/ai.service.js";
import dotenv from "dotenv";
import connectDB from "../config/db.js";

dotenv.config();

// ---------------- INIT ----------------
await connectDB();
console.log("🔥 Analysis Worker Started...");

// ---------------- SAFETY FILTER ----------------
const sanitizeResult = (result) => {
  result.summary = result.summary || "";
  result.keyPoints = result.keyPoints || [];
  result.notes = result.notes || "";

  result.actionSteps = result.actionSteps || [];
  result.roadmap = result.roadmap || [];
  result.qa = result.qa || [];
  result.executionPlan = result.executionPlan || [];
  result.learningPath = result.learningPath || [];

  result.actionEngine = result.actionEngine || [];

  result.project = result.project || {
    title: "",
    features: [],
    techStack: [],
    folderStructure: [],
    starterCode: "",
  };

  // 🔥 normalize
  result.contentType = (result.contentType || "general").toLowerCase();

  // 🔥 filter
  if (result.contentType !== "tech") {
    result.project = {
      title: "",
      features: [],
      techStack: [],
      folderStructure: [],
      starterCode: "",
    };
    result.actionEngine = [];
  }

  return result;
};

// ---------------- WORKER ----------------
const worker = new Worker(
  "analysis",
  async (job) => {
    const start = Date.now();

    console.log("📦 Job received:", job.id);

    const { analysisId, userId, youtubeUrl, goal, language, credits } =
      job.data;

    try {
      // 🔥 STEP 1: Mark processing
      await Analysis.findByIdAndUpdate(analysisId, {
        status: "processing",
        startedAt: new Date(),
      });

      // 🔥 STEP 2: Run AI with timeout
      const aiPromise = runAI({ youtubeUrl, goal, language });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 60000),
      );

      let result = await Promise.race([aiPromise, timeoutPromise]);

      if (
        !result.summary ||
        result.summary.length < 10 ||
        !Array.isArray(result.keyPoints)
      ) {
        throw new Error("Invalid AI output");
      }

      // 🔥 STEP 3: Safety filter
      result = sanitizeResult(result);

      // 🔥 STEP 4: Save result
      const updated = await Analysis.findByIdAndUpdate(
        analysisId,
        {
          ...result,
          contentType: result.contentType,
          status: "completed",
          completedAt: new Date(),
          processingTime: Date.now() - start,
        },
        { new: true },
      );

      if (!updated) {
        throw new Error("Analysis update failed");
      }

      // 🔥 STEP 5: Safe credit deduction
      // 🔥 STEP 5: Atomic credit deduction (BEST)
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, credits: { $gte: credits } },
        { $inc: { credits: -credits } },
        { returnDocument: "after" },
      );

      if (!updatedUser) {
        console.log("⚠️ Credit deduction skipped (insufficient credits)");
      } else {
        console.log("💰 Credits deducted. Remaining:", updatedUser.credits);
      }

      console.log("🎉 DONE:", analysisId);

      return { success: true };
    } catch (err) {
      console.error("❌ Worker error:", err.message);

      await Analysis.findByIdAndUpdate(analysisId, {
        status: "failed",
        error: err.message,
      });

      throw err; // 🔥 IMPORTANT (for retry)
    }
  },
  {
    connection,
    concurrency: 3,
  },
);

// ---------------- EVENTS ----------------

worker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job.id}`, err.message);
});

worker.on("error", (err) => {
  console.error("🚨 Worker crashed:", err);
});
