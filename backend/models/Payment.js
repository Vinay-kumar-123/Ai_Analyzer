import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    orderId: { type: String, index: true },
    paymentId: {
      type: String,
      index: {
        unique: true,
        partialFilterExpression: { paymentId: { $type: "string" } },
      },
    },

    amount: Number,
    currency: String,

    credits: Number,

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },

    source: {
      type: String,
      enum: ["verify_api", "webhook"],
    },

    // 🔥 prevent double-credit
    isCredited: { type: Boolean, default: false },

    // 🔥 for expiry tracking (optional but useful)
    expiresAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);