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
      required: true,
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
      default: 10, // initial free credits
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

export default mongoose.model("User", userSchema);
