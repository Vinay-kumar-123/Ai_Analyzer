import mongoose from "mongoose";

const userAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analysis",
      required: true,
      index: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Enforce unique mapping between a user and an analysis
userAnalysisSchema.index({ user: 1, analysis: 1 }, { unique: true });
userAnalysisSchema.index({ user: 1, createdAt: -1 });

const UserAnalysis = mongoose.models.UserAnalysis || mongoose.model("UserAnalysis", userAnalysisSchema);

export default UserAnalysis;
