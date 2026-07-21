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

    // ── AI Tutor Tracking ─────────────────────────────────
    tutorMessagesCount:     { type: Number, default: 0, min: 0 },
    tutorPurchasedPackages: { type: Number, default: 0, min: 0 },
    tutorHistory: [
      {
        role:                { type: String, enum: ["user", "assistant"], required: true },
        content:             { type: String, required: true },
        followUpSuggestions: { type: [String], default: [] },
        createdAt:           { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// Cap conversation history at 100 messages max per analysis mapping
userAnalysisSchema.pre("save", function () {
  if (Array.isArray(this.tutorHistory) && this.tutorHistory.length > 100) {
    this.tutorHistory = this.tutorHistory.slice(-100);
  }
});

// Enforce unique mapping between a user and an analysis
userAnalysisSchema.index({ user: 1, analysis: 1 }, { unique: true });
userAnalysisSchema.index({ user: 1, createdAt: -1 });

const UserAnalysis = mongoose.models.UserAnalysis || mongoose.model("UserAnalysis", userAnalysisSchema);

export default UserAnalysis;
