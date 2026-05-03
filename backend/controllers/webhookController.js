import crypto from "crypto";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

export const razorpayWebhook = async (req, res) => {
  console.log("🚀 WEBHOOK HIT");

  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body) // raw body
      .digest("hex");

    if (expected !== signature) {
      console.log("❌ Webhook signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    // 🔥 parse AFTER signature verify
    const event = JSON.parse(req.body.toString());

    console.log("📩 WEBHOOK EVENT:", event.event);

    // ---------------- HANDLE EVENT ----------------
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;

      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const payment = await Payment.findOne({ orderId });

      if (!payment) {
        console.log("⚠️ Payment not found");
        return res.json({ ok: true });
      }

      if (payment.isCredited) {
        console.log("⚠️ Already credited");
        return res.json({ ok: true });
      }

      const expiry = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );

      payment.paymentId = paymentId;
      payment.status = "paid";
      payment.source = "webhook";
      payment.isCredited = true;
      payment.expiresAt = expiry;

      await payment.save();

      await User.updateOne(
        { _id: payment.user },
        {
          $inc: { credits: payment.credits },
          $set: { creditsExpiry: expiry },
        }
      );

      console.log("🎉 Credits added via webhook");
    }

    res.json({ ok: true });

  } catch (err) {
    console.error("❌ Webhook Error:", err);
    res.status(500).send("Webhook failed");
  }
};