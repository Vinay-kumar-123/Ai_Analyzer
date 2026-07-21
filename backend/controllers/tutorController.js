import mongoose from "mongoose";
import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
import UserAnalysis from "../models/UserAnalysis.js";
import { buildTutorRAGContext } from "../services/tutor.service.js";
import { generateTutorResponse } from "../generators/tutor.generator.js";

const FREE_LIMIT = 10;
const PACK_SIZE = 10;

/**
 * Calculates current message quota and usage for a user's analysis mapping.
 */
function calculateTutorUsage(userAnalysis) {
  const messagesUsed = userAnalysis?.tutorMessagesCount || 0;
  const packsBought  = userAnalysis?.tutorPurchasedPackages || 0;
  const totalQuota   = FREE_LIMIT + packsBought * PACK_SIZE;

  const freeMessagesUsed      = Math.min(FREE_LIMIT, messagesUsed);
  const freeMessagesRemaining = Math.max(0, FREE_LIMIT - messagesUsed);
  const totalMessagesRemaining = Math.max(0, totalQuota - messagesUsed);

  return {
    freeMessagesUsed,
    freeMessagesRemaining,
    totalMessagesRemaining,
    requiresCredit: totalMessagesRemaining <= 0,
  };
}

/**
 * POST /api/analyze/:id/tutor/chat
 * Handles multi-turn grounded tutor questions and enforces message quotas.
 */
export const chatWithTutor = async (req, res) => {
  const { id: analysisId } = req.params;
  const userId = req.user?.id;
  const { message } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "Question message is required." });
  }

  const cleanQuestion = message.trim().slice(0, 500);

  try {
    // 1. Verify user ownership & retrieve mapping
    const userAnalysis = await UserAnalysis.findOne({ user: userId, analysis: analysisId });
    if (!userAnalysis) {
      return res.status(404).json({ success: false, message: "Analysis mapping not found." });
    }

    // 2. Retrieve analysis document
    const analysis = await Analysis.findById(analysisId);
    if (!analysis || analysis.status !== "completed") {
      return res.status(400).json({ success: false, message: "Analysis is not yet completed." });
    }

    // 3. Check message quota
    const usageBefore = calculateTutorUsage(userAnalysis);

    if (usageBefore.requiresCredit) {
      return res.status(402).json({
        success: false,
        error: "FREE_LIMIT_EXHAUSTED",
        requiresCredit: true,
        message: "You've used all free AI Tutor messages for this analysis. Spend 1 credit to unlock 10 more messages.",
        data: {
          freeMessagesUsed: usageBefore.freeMessagesUsed,
          freeMessagesRemaining: 0,
          totalMessagesRemaining: 0,
        },
      });
    }

    // 4. Build RAG context (Knowledge Core -> Notes -> Transcript Snippets)
    const ragContext = buildTutorRAGContext({ analysis, question: cleanQuestion });

    // 5. Retrieve recent rolling history from UserAnalysis
    const history = (userAnalysis.tutorHistory || []).map((h) => ({
      role: h.role,
      content: h.content,
    }));

    // 6. Execute AI Tutor generator (uses configured FAST model)
    const result = await generateTutorResponse({
      question: cleanQuestion,
      ragContext,
      history,
      goal: analysis.goal,
      language: analysis.language,
    });

    // 7. Update UserAnalysis mapping (increment message count, push history)
    userAnalysis.tutorMessagesCount += 1;
    userAnalysis.tutorHistory.push({
      role: "user",
      content: cleanQuestion,
    });
    userAnalysis.tutorHistory.push({
      role: "assistant",
      content: result.reply,
      followUpSuggestions: result.followUpSuggestions,
    });

    await userAnalysis.save();

    const usageAfter = calculateTutorUsage(userAnalysis);

    return res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        followUpSuggestions: result.followUpSuggestions,
        usage: usageAfter,
        history: userAnalysis.tutorHistory.slice(-20), // return recent history slice
      },
    });
  } catch (err) {
    console.error("chatWithTutor error:", err.stack || err.message);
    return res.status(500).json({ success: false, message: "Failed to generate tutor response." });
  }
};

/**
 * POST /api/analyze/:id/tutor/purchase-pack
 * Deducts 1 credit from user's account to purchase +10 tutor messages for this analysis.
 */
export const purchaseTutorPackage = async (req, res) => {
  const { id: analysisId } = req.params;
  const userId = req.user?.id;

  try {
    const userAnalysis = await UserAnalysis.findOne({ user: userId, analysis: analysisId });
    if (!userAnalysis) {
      return res.status(404).json({ success: false, message: "Analysis mapping not found." });
    }

    // Atomic credit deduction: deduct 1 credit ONLY IF credits >= 1
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: 1 } },
      { $inc: { credits: -1, creditsUsed: 1 } },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits. Please purchase credits to unlock more AI Tutor messages.",
      });
    }

    // Grant 1 package (+10 messages) ONLY after successful credit deduction
    userAnalysis.tutorPurchasedPackages += 1;
    await userAnalysis.save();

    const usage = calculateTutorUsage(userAnalysis);

    return res.status(200).json({
      success: true,
      message: "Unlocked 10 additional AI Tutor messages!",
      data: {
        userCredits: updatedUser.credits || 0,
        tutorPurchasedPackages: userAnalysis.tutorPurchasedPackages,
        usage,
      },
    });
  } catch (err) {
    console.error("purchaseTutorPackage error:", err.stack || err.message);
    return res.status(500).json({ success: false, message: "Failed to purchase AI Tutor message pack." });
  }
};

/**
 * GET /api/analyze/:id/tutor/status
 * Returns current tutor usage status and history for the frontend workspace.
 */
export const getTutorStatus = async (req, res) => {
  const { id: analysisId } = req.params;
  const userId = req.user?.id;

  try {
    const userAnalysis = await UserAnalysis.findOne({ user: userId, analysis: analysisId });
    if (!userAnalysis) {
      return res.status(404).json({ success: false, message: "Analysis mapping not found." });
    }

    const usage = calculateTutorUsage(userAnalysis);

    return res.status(200).json({
      success: true,
      data: {
        usage,
        history: userAnalysis.tutorHistory || [],
      },
    });
  } catch (err) {
    console.error("getTutorStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve tutor status." });
  }
};

export default {
  chatWithTutor,
  purchaseTutorPackage,
  getTutorStatus,
};
