import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Plan from "../models/Plan.js";
import crypto from "crypto";
import { razorpay } from "../config/razorpay.js";

// ================= CREATE ORDER =================

// export const createOrder = async (req, res) => {
//   try {
//     const { planId } = req.body;

//     const plan = await Plan.findById(planId);
//     if (!plan) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Plan not found" });
//     }

//     const order = await razorpay.orders.create({
//       amount: plan.price * 100,
//       currency: "INR",
//       receipt: `rcpt_${Date.now()}`,
//       notes: {
//         userId: req.user.id,
//         credits: plan.credits,
//       },
//     });

//     // 🔥 store initial payment record
//     await Payment.create({
//       user: req.user.id,
//       orderId: order.id,
//       amount: plan.price,
//       currency: "INR",
//       credits: plan.credits,
//       status: "created",
//     });

//     return res.json({ success: true, order });
//   } catch (err) {
//     console.error("❌ Order Error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
export const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user.id,
        credits: plan.credits,
      },
    });

    // 🔥 SAVE PAYMENT (IMPORTANT)
    await Payment.create({
      user: req.user.id,
      orderId: order.id,
      amount: plan.price,
      currency: "INR",
      credits: plan.credits,
      status: "created",
    });

    return res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Order Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// ================= VERIFY PAYMENT =================

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    console.log("ORDER:", razorpay_order_id);
    console.log("PAYMENT:", razorpay_payment_id);
    console.log("SIGNATURE:", razorpay_signature);

    console.log("SECRET:", process.env.RAZORPAY_KEY_SECRET);
    // 🔥 signature verify
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET.trim())
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }
    console.log("VERIFY BODY:", req.body);
    // 🔥 get payment from DB
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    console.log("PAYMENT FOUND:", payment);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // 🔥 idempotent check
    if (payment.isCredited) {
      return res.json({
        success: true,
        message: "Already credited",
      });
    }

    // 🔥 update payment
    payment.paymentId = razorpay_payment_id;
    payment.status = "paid";
    payment.source = "verify_api";

    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    payment.expiresAt = expiry;

    await payment.save();

    // 🔥 IMPORTANT: credits from DB
    const creditsToAdd = payment.credits;

    if (!creditsToAdd) {
      throw new Error("Credits missing in payment record");
    }

    // 🔥 add credits safely
    await User.updateOne(
      { _id: req.user.id },
      {
        $inc: { credits: creditsToAdd },
        $set: { creditsExpiry: expiry },
      },
    );

    payment.isCredited = true;
    await payment.save();

    return res.json({
      success: true,
      message: "Payment verified & credits added",
    });
  } catch (err) {
    console.error("❌ Verify Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
