"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function BuyCreditsPage() {
  const [plans, setPlans] = useState([]);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const { updateCredits } = useAuth();
  const router = useRouter();

  // ---------------- FETCH PLANS ----------------
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/plans`
      );

      const data = await res.json();

      if (!data.success) throw new Error("Failed to fetch plans");

      setPlans(data.data || []);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to load plans");
    } finally {
      setPageLoading(false);
    }
  };

  // ---------------- LOAD RAZORPAY ----------------
  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });

  // ---------------- PAYMENT ----------------
  const handlePayment = async (plan) => {
    setLoadingPlanId(plan._id);

    // 🔥 ENV CHECK (important)
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY) {
      alert("❌ Razorpay key missing");
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded) {
      alert("❌ Razorpay SDK failed to load");
      setLoadingPlanId(null);
      return;
    }

    try {
      // 🔥 CREATE ORDER (secure: only planId)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/order`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan._id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.message || "Order creation failed");
      }

      // 🔥 OPTIONS
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: data.order.amount,
        currency: "INR",
        order_id: data.order.id,

        name: "AI Analyzer",
        description: `${plan.credits} Credits Plan`,

        handler: async (response) => {
          try {
            // 🔥 VERIFY PAYMENT (NO credits from frontend)
            const verifyRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify`,
              {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              }
            );

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              throw new Error("Verification failed");
            }

            // 🔥 FETCH UPDATED CREDITS
            const creditRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/credits`,
              { credentials: "include" }
            );

            const creditData = await creditRes.json();

            updateCredits(creditData.data.credits);

            alert("🎉 Payment Successful! Credits added");

            router.push("/dashboard");
          } catch (err) {
            console.error(err);
            alert("❌ Payment verification failed");
          } finally {
            setLoadingPlanId(null);
          }
        },

        // 🔥 IMPORTANT: payment fail handling
        modal: {
          ondismiss: () => {
            setLoadingPlanId(null);
            console.log("User closed payment");
          },
        },

        // 🔥 HANDLE FAILURE
        notes: {
          planId: plan._id,
        },

        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new window.Razorpay(options);

      // 🔥 PAYMENT FAILED EVENT
      rzp.on("payment.failed", function (response) {
        console.error("Payment Failed:", response.error);
        alert("❌ Payment failed. Try again.");
        setLoadingPlanId(null);
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert("❌ Payment failed");
      setLoadingPlanId(null);
    }
  };

  // ---------------- UI ----------------
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-3">
        💳 Choose Your Plan
      </h1>

      <p className="text-center text-gray-500 mb-10">
        Credits expire in 30 days — use them wisely 🚀
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan._id}
              className={`relative border rounded-2xl p-6 text-center shadow hover:shadow-xl transition ${
                isPopular ? "border-blue-600 scale-105" : ""
              }`}
            >
              {isPopular && (
                <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Most Popular
                </span>
              )}

              <h2 className="text-xl font-bold">{plan.name}</h2>

              <p className="text-4xl font-extrabold mt-4">
                ₹{plan.price}
              </p>

              <p className="text-green-600 mt-2 font-medium">
                {plan.credits} credits
              </p>

              <ul className="text-sm text-gray-500 mt-4 space-y-1">
                <li>✔ Instant access</li>
                <li>✔ 30 days validity</li>
                <li>✔ Fast AI processing</li>
              </ul>

              <button
                onClick={() => handlePayment(plan)}
                disabled={loadingPlanId === plan._id}
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingPlanId === plan._id
                  ? "Processing..."
                  : "Buy Now"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}