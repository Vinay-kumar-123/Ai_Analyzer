import mongoose from "mongoose";
import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
import UserAnalysis from "../models/UserAnalysis.js";

// ---------------- GET DASHBOARD STATS ----------------

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // ✅ Run queries in parallel (faster)
    const [totalAnalyses, userAnalyses, user] = await Promise.all([
      UserAnalysis.countDocuments({ user: userId }),

      UserAnalysis.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate({
          path: "analysis",
          select: "videoTitle youtubeUrl thumbnail status creditsUsed createdAt language contentType goal",
        })
        .lean(),

      User.findById(userId).select("credits subscriptionPlan creditsExpiry").lean(),
    ]);

    const recentAnalyses = userAnalyses
      .map((ua) => {
        if (!ua.analysis) return null;
        return {
          ...ua.analysis,
          _id: ua.analysis._id,
          createdAt: ua.createdAt,
        };
      })
      .filter(Boolean);

    const expiry = user?.creditsExpiry ? new Date(user.creditsExpiry) : null;
    const remainingValidityDays = expiry
      ? Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalAnalyses,
        recentAnalyses,
        credits: user?.credits || 0,
        creditsExpiry: user?.creditsExpiry || null,
        remainingValidityDays,
        subscription: user?.subscriptionPlan || "free",
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- GET CREDIT BALANCE ----------------

export const getCreditBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("credits creditsExpiry").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const expiry = user.creditsExpiry ? new Date(user.creditsExpiry) : null;
    const remainingValidityDays = expiry
      ? Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        credits: user.credits,
        creditsExpiry: user.creditsExpiry || null,
        remainingValidityDays,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- GET ANALYSIS HISTORY (PAGINATED) ----------------

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const getAnalysisHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ✅ Pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // ✅ Query filters
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status : "all";
    const language = typeof req.query.language === "string" ? req.query.language : "all";
    const goal = typeof req.query.goal === "string" ? req.query.goal : "all";
    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "newest";

    const matchConditions = {};

    if (status !== "all") {
      matchConditions["analysisDetails.status"] = status;
    }
    if (language !== "all") {
      matchConditions["analysisDetails.language"] = language.toLowerCase();
    }
    if (goal !== "all") {
      matchConditions["analysisDetails.goal"] = goal.toLowerCase();
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search), "i");
      matchConditions.$or = [
        { "analysisDetails.videoTitle": searchRegex },
        { "analysisDetails.channelName": searchRegex }
      ];
    }

    const sortStage = {};
    if (sortBy === "oldest") {
      sortStage["createdAt"] = 1;
    } else {
      sortStage["createdAt"] = -1; // Default newest first
    }

    // Single DB round-trip count and slice facet pipeline
    const facetPipeline = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "analyses",
          localField: "analysis",
          foreignField: "_id",
          as: "analysisDetails"
        }
      },
      { $unwind: "$analysisDetails" },
      { $match: matchConditions },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit }
          ]
        }
      }
    ];

    const result = await UserAnalysis.aggregate(facetPipeline);
    const total = result[0]?.metadata[0]?.total || 0;
    const userAnalyses = result[0]?.data || [];

    const analyses = userAnalyses
      .map((ua) => {
        if (!ua.analysisDetails) return null;
        return {
          ...ua.analysisDetails,
          _id: ua.analysisDetails._id,
          createdAt: ua.createdAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        analyses,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- GET SINGLE ANALYSIS ----------------

export const getSingleAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID",
      });
    }

    const access = await UserAnalysis.findOne({
      analysis: id,
      user: req.user.id,
    }).lean();

    if (!access) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    const analysis = await Analysis.findById(id).lean();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- DELETE ANALYSIS ----------------

export const deleteAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID",
      });
    }

    const access = await UserAnalysis.findOneAndDelete({
      analysis: id,
      user: req.user.id,
    });

    if (!access) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found or access denied",
      });
    }

    // Clean up global analysis if no other user is linked to it
    const remaining = await UserAnalysis.countDocuments({ analysis: id });
    if (remaining === 0) {
      await Analysis.deleteOne({ _id: id });
    }

    return res.status(200).json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
