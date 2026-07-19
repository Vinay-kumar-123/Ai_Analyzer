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

      // 🔥 atomic check & update (prevents duplicate credits with concurrent verify API)
      const updatedPayment = await Payment.findOneAndUpdate(
        { orderId, isCredited: false },
        {
          $set: {
            paymentId,
            status: "paid",
            source: "webhook",
            isCredited: true,
            expiresAt: expiry,
          },
        },
        { returnDocument: "after" }
      );

      if (!updatedPayment) {
        console.log("⚠️ Payment already credited concurrently or not found");
        return res.json({ ok: true });
      }

      try {
        const userDoc = await User.findById(updatedPayment.user);
        if (!userDoc) {
          throw new Error("User not found");
        }
        const isExpired = userDoc.creditsExpiry && new Date() > userDoc.creditsExpiry;
        const finalCredits = isExpired ? updatedPayment.credits : (userDoc.credits || 0) + updatedPayment.credits;

        await User.updateOne(
          { _id: updatedPayment.user },
          {
            $set: {
              credits: finalCredits,
              creditsExpiry: expiry,
            },
          }
        );
        console.log("🎉 Credits added via webhook");
      } catch (userUpdateError) {
        // 🔥 Rollback state to allow subsequent retries/webhooks
        await Payment.updateOne(
          { _id: updatedPayment._id },
          { $set: { isCredited: false, status: "created" } }
        );
        throw userUpdateError;
      }
    }

    res.json({ ok: true });

  } catch (err) {
    console.error("❌ Webhook Error:", err);
    res.status(500).send("Webhook failed");
  }
};