"use client";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

import Navbar from "@/components/Navbar";

export default function BuyCreditsPage() {
  // ======================================================
  // STATE
  // ======================================================

  const [plans, setPlans] =
    useState([]);

  const [
    loadingPlanId,
    setLoadingPlanId,
  ] = useState(null);

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);

  const [success, setSuccess] =
    useState(false);

  const { updateCredits } =
    useAuth();

  const router = useRouter();

  // ======================================================
  // FETCH PLANS
  // ======================================================

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/plans`
      );

      const data =
        await res.json();

      if (!data.success) {
        throw new Error(
          "Failed to fetch plans"
        );
      }

      setPlans(data.data || []);

    } catch (err) {
      console.error(err);

      alert(
        "❌ Failed to load plans"
      );

    } finally {
      setPageLoading(false);
    }
  };

  // ======================================================
  // LOAD RAZORPAY
  // ======================================================

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () =>
        resolve(true);

      script.onerror = () =>
        resolve(false);

      document.body.appendChild(
        script
      );
    });

  // ======================================================
  // PAYMENT
  // ======================================================

  const handlePayment = async (
    plan
  ) => {
    setLoadingPlanId(plan._id);

    // ------------------------------------------------------
    // ENV CHECK
    // ------------------------------------------------------

    if (
      !process.env
        .NEXT_PUBLIC_RAZORPAY_KEY
    ) {
      alert(
        "❌ Razorpay key missing"
      );

      setLoadingPlanId(null);

      return;
    }

    // ------------------------------------------------------
    // LOAD SDK
    // ------------------------------------------------------

    const loaded =
      await loadRazorpay();

    if (!loaded) {
      alert(
        "❌ Razorpay SDK failed"
      );

      setLoadingPlanId(null);

      return;
    }

    try {
      // ------------------------------------------------------
      // CREATE ORDER
      // ------------------------------------------------------

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/order`,
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            planId: plan._id,
          }),
        }
      );

      const data =
        await res.json();

      if (
        !res.ok ||
        !data.success ||
        !data.order
      ) {
        throw new Error(
          data.message ||
            "Order creation failed"
        );
      }

      // ------------------------------------------------------
      // OPTIONS
      // ------------------------------------------------------

      const options = {
        key: process.env
          .NEXT_PUBLIC_RAZORPAY_KEY,

        amount:
          data.order.amount,

        currency: "INR",

        order_id:
          data.order.id,

        name: "AI Analyzer",

        description: `${plan.credits} Credits Plan`,

        image:
          "/logo.png",

        notes: {
          planId: plan._id,
        },

        theme: {
          color: "#2563eb",
        },

        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        handler: async (
          response
        ) => {
          try {
            const verifyRes =
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify`,
                {
                  method:
                    "POST",

                  credentials:
                    "include",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify(
                    response
                  ),
                }
              );

            const verifyData =
              await verifyRes.json();

            if (
              !verifyData.success
            ) {
              throw new Error(
                "Verification failed"
              );
            }

            // ------------------------------------------------------
            // UPDATE CREDITS
            // ------------------------------------------------------

            const creditRes =
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/credits`,
                {
                  credentials:
                    "include",
                }
              );

            const creditData =
              await creditRes.json();

            updateCredits(
              creditData.data
                .credits
            );

            // ------------------------------------------------------
            // SUCCESS UI
            // ------------------------------------------------------

            setSuccess(true);

            setTimeout(() => {
              router.push(
                "/dashboard"
              );
            }, 2000);

          } catch (err) {
            console.error(err);

            alert(
              "❌ Payment verification failed"
            );
          } finally {
            setLoadingPlanId(
              null
            );
          }
        },

        // ------------------------------------------------------
        // CLOSE
        // ------------------------------------------------------

        modal: {
          ondismiss: () => {
            setLoadingPlanId(
              null
            );
          },
        },
      };

      const rzp =
        new window.Razorpay(
          options
        );

      // ------------------------------------------------------
      // FAILED
      // ------------------------------------------------------

      rzp.on(
        "payment.failed",

        function (response) {
          console.error(
            "Payment Failed:",
            response.error
          );

          alert(
            "❌ Payment failed. Try again."
          );

          setLoadingPlanId(
            null
          );
        }
      );

      rzp.open();

    } catch (err) {
      console.error(err);

      alert("❌ Payment failed");

      setLoadingPlanId(null);
    }
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">

        <div className="text-center">

          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />

          <p className="mt-4 text-gray-600">
            Loading premium plans...
          </p>

        </div>

      </div>
    );
  }

  // ======================================================
  // SUCCESS
  // ======================================================

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

        <motion.div
          initial={{
            scale: 0.5,
            opacity: 0,
          }}

          animate={{
            scale: 1,
            opacity: 1,
          }}
        >
          <CheckCircle2 className="w-28 h-28 text-green-500 mx-auto" />

          <h1 className="text-4xl font-bold mt-6 text-center">
            Payment Successful 🎉
          </h1>

          <p className="text-gray-400 mt-3 text-center">
            Credits added to your account
          </p>

        </motion.div>

      </div>
    );
  }

  // ======================================================
  // MAIN
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      {/* HERO */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6">

        <div className="max-w-6xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">

            <Sparkles size={18} />

            Premium AI Learning

          </div>

          <h1 className="text-5xl font-bold leading-tight">
            Upgrade Your Learning
            Experience 🚀
          </h1>

          <p className="text-xl text-blue-100 mt-6 max-w-3xl mx-auto leading-8">
            Generate premium AI notes,
            execution plans, interview
            prep, project guidance and
            deep explanations from any
            YouTube video.
          </p>

        </div>

      </div>

      {/* PLANS */}
      <div className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid lg:grid-cols-3 gap-8">

          {plans.map(
            (plan, index) => {
              const isPopular =
                plan.isPopular;

              return (
                <motion.div
                  key={plan._id}

                  initial={{
                    opacity: 0,
                    y: 30,
                  }}

                  animate={{
                    opacity: 1,
                    y: 0,
                  }}

                  transition={{
                    delay:
                      index * 0.1,
                  }}

                  className={`relative rounded-3xl overflow-hidden border bg-white shadow-lg hover:shadow-2xl transition-all ${
                    isPopular
                      ? "border-blue-600 scale-105"
                      : "border-gray-200"
                  }`}
                >
                  {/* POPULAR */}
                  {isPopular && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">

                      <Crown size={14} />

                      Most Popular

                    </div>
                  )}

                  <div className="p-8">

                    {/* TITLE */}
                    <div className="flex items-center gap-3">

                      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">

                        <Zap className="text-blue-600" />

                      </div>

                      <div>

                        <h2 className="text-2xl font-bold">
                          {plan.name}
                        </h2>

                        <p className="text-gray-500 text-sm">
                          Premium AI credits
                        </p>

                      </div>

                    </div>

                    {/* PRICE */}
                    <div className="mt-8">

                      <div className="flex items-end gap-2">

                        <span className="text-5xl font-extrabold">
                          ₹
                          {
                            plan.price
                          }
                        </span>

                        <span className="text-gray-500 mb-2">
                          one-time
                        </span>

                      </div>

                      <p className="text-green-600 font-semibold mt-3">
                        {
                          plan.credits
                        }{" "}
                        AI Credits
                      </p>

                    </div>

                    {/* FEATURES */}
                    <div className="mt-8 space-y-4">

                      {[
                        "Deep AI Notes",
                        "Execution Plans",
                        "Roadmaps",
                        "Interview Questions",
                        "Project Generation",
                        "Premium AI Engine",
                      ].map(
                        (
                          feature,
                          i
                        ) => (
                          <div
                            key={i}
                            className="flex items-center gap-3"
                          >
                            <CheckCircle2
                              size={
                                18
                              }
                              className="text-green-500"
                            />

                            <span className="text-gray-700">
                              {
                                feature
                              }
                            </span>

                          </div>
                        )
                      )}

                    </div>

                    {/* BUTTON */}
                    <button
                      onClick={() =>
                        handlePayment(
                          plan
                        )
                      }

                      disabled={
                        loadingPlanId ===
                        plan._id
                      }

                      className={`mt-10 w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        isPopular
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-black hover:bg-gray-900 text-white"
                      } disabled:opacity-50`}
                    >
                      {loadingPlanId ===
                      plan._id ? (
                        <>
                          <Loader2 className="animate-spin w-5 h-5" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Buy Now
                        </>
                      )}
                    </button>

                  </div>

                </motion.div>
              );
            }
          )}

        </div>

        {/* TRUST */}
        <div className="mt-20 grid md:grid-cols-3 gap-6">

          {[
            {
              title:
                "Secure Payments",
              desc:
                "Powered by Razorpay with bank-level security",
            },

            {
              title:
                "Instant Credits",
              desc:
                "Credits added instantly after payment",
            },

            {
              title:
                "AI Premium Engine",
              desc:
                "Advanced AI teaching and learning system",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-8 shadow border"
            >
              <ShieldCheck className="text-blue-600 w-10 h-10" />

              <h3 className="text-xl font-bold mt-5">
                {item.title}
              </h3>

              <p className="text-gray-500 mt-3 leading-7">
                {item.desc}
              </p>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}