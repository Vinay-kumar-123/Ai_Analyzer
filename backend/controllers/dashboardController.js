import mongoose from "mongoose";
import User from "../models/User.js";
import Analysis from "../models/Analysis.js";

// ---------------- GET DASHBOARD STATS ----------------

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // ✅ Run queries in parallel (faster)
    const [totalAnalyses, recentAnalyses, user] = await Promise.all([
      Analysis.countDocuments({ user: userId }),

      Analysis.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .select(
          `videoTitle youtubeUrl thumbnail status creditsUsed createdAt language contentType goal`,
        )
        .lean(),

      User.findById(userId).select("credits subscriptionPlan").lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalAnalyses,
        recentAnalyses,
        credits: user?.credits || 0,
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
    const user = await User.findById(req.user.id).select("credits").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        credits: user.credits,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- GET ANALYSIS HISTORY (PAGINATED) ----------------

export const getAnalysisHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ✅ Pagination (VERY IMPORTANT)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      Analysis.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "videoTitle youtubeUrl thumbnail status creditsUsed createdAt language",
        )
        .lean(),

      Analysis.countDocuments({ user: userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        analyses,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
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

    const analysis = await Analysis.findOne({
      _id: id,
      user: req.user.id,
    }).lean();

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

    const deleted = await Analysis.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
