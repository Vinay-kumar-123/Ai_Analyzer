import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    picture: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: ["google", "local", "github"],
      default: "google",
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    welcomeCreditsGiven: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["student", "developer", "job_seeker"],
      default: "student",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    credits: {
      type: Number,
      default: 0, // Assigned explicitly on registration/google auth
    },
    creditsExpiry: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 30); // 30 days validity
        return d;
      },
    },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", userSchema);
