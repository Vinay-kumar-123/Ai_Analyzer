"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
  Crown,
  Clock,
  AlertTriangle,
  ChevronDown,
  Calendar,
  ShieldAlert,
  BadgeAlert
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

export default function BuyCreditsPage() {
  const [plans, setPlans] = useState([]);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const { user, updateCredits } = useAuth();
  const router = useRouter();

  // ─────────────────────────────────────────────────────────────
  // FETCH PLANS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plans`);
      const data = await res.json();

      if (!data.success) {
        throw new Error("Failed to fetch plans");
      }
      setPlans(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // LOAD RAZORPAY
  // ─────────────────────────────────────────────────────────────

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ─────────────────────────────────────────────────────────────
  // PAYMENT FLOW
  // ─────────────────────────────────────────────────────────────

  const handlePayment = async (plan) => {
    setLoadingPlanId(plan._id);

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY) {
      alert("❌ Razorpay key missing from environments.");
      setLoadingPlanId(null);
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded) {
      alert("❌ Razorpay SDK failed to load.");
      setLoadingPlanId(null);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/order`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId: plan._id,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.message || "Order creation failed");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: data.order.amount,
        currency: "INR",
        order_id: data.order.id,
        name: "AI Analyzer",
        description: `${plan.credits} Credits Plan`,
        image: "/logo.png",
        notes: {
          planId: plan._id,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(response),
              }
            );

            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
              throw new Error("Verification failed");
            }

            // Refetch fresh credits metadata
            const creditRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/credits`,
              {
                credentials: "include",
              }
            );

            const creditData = await creditRes.json();
            updateCredits(creditData.data.credits);

            setSuccess(true);
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          } catch (err) {
            console.error(err);
            alert("❌ Payment verification failed.");
          } finally {
            setLoadingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoadingPlanId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
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

  // ─────────────────────────────────────────────────────────────
  // BALANCE CALCULATOR METRICS
  // ─────────────────────────────────────────────────────────────

  const creditDetails = useMemo(() => {
    if (!user) return null;
    const balance = user.credits ?? 0;
    const expiry = user.creditsExpiry ? new Date(user.creditsExpiry) : null;
    const daysLeft = expiry ? Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    const isActive = balance > 0 && daysLeft > 0;
    return { balance, expiry, daysLeft, isActive };
  }, [user]);

  // ─────────────────────────────────────────────────────────────
  // RENDERING states
  // ─────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#080a12] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Loading premium pricing plans...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#080a12] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#10b981,transparent_55%)] pointer-events-none" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full max-w-sm text-center bg-[#0b0f19]/60 border border-emerald-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-md">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tight leading-none mb-3">Payment Successful 🎉</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your new credits balance has been added and activated. Redirecting back to your learning workspace dashboard...
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-blue-400 mx-auto" />
        </motion.div>
      </div>
    );
  }

  const faqs = [
    {
      q: "How long are credits valid?",
      a: "Purchased credits remain valid for exactly 30 days from the timestamp of payment verification.",
    },
    {
      q: "When are credits deducted?",
      a: "Credits are only deducted once video parsing begins. Input URL validation is 100% free.",
    },
    {
      q: "What happens after validity expiry?",
      a: "According to business rules, remaining credits reset to 0 and active status shifts to Expired. Purchasing a new plan extends validity for another 30 days.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080a12] text-white overflow-x-hidden">
      <Navbar />

      {/* HERO GLOW HEADER */}
      <section className="relative pt-24 pb-12 overflow-hidden border-b border-white/5 bg-slate-950/20">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top,#2563eb,transparent_45%)]" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 px-4.5 py-2 rounded-full text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Sparkles size={12} className="text-yellow-400" />
            <span>Premium Learning Credits</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Buy Credits & Upgrade
            <br />
            Your Workspace
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            Choose the package matching your learning speed. Synthesize deep notes, execution roadmaps, and custom tests instantly.
          </p>
        </div>
      </section>

      {/* BODY CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-20">
        
        {/* CURRENT BALANCE METRIC CARDS */}
        {creditDetails && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Balance */}
            <div className="bg-[#0b0f19]/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center mb-4">
                <Zap size={14} className="fill-yellow-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Available Balance</span>
              <p className="text-xl font-black text-white mt-1 leading-none">{creditDetails.balance} Credits</p>
            </div>

            {/* Status */}
            <div className="bg-[#0b0f19]/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 ${
                creditDetails.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
              }`}>
                <CheckCircle2 size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Validity Status</span>
              <p className="text-xl font-black text-white mt-1 leading-none capitalize">
                {creditDetails.isActive ? "Active" : "Expired"}
              </p>
            </div>

            {/* Days Left */}
            <div className="bg-[#0b0f19]/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Clock size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Remaining Days</span>
              <p className="text-xl font-black text-white mt-1 leading-none">
                {creditDetails.daysLeft > 0 ? `${creditDetails.daysLeft} Days Left` : "None"}
              </p>
            </div>

            {/* Expiry Date */}
            <div className="bg-[#0b0f19]/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Calendar size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Expiry Date</span>
              <p className="text-sm font-black text-white mt-2 leading-none">
                {creditDetails.expiry ? creditDetails.expiry.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                }) : "N/A"}
              </p>
            </div>
          </div>
        )}

        {/* PRICING PLANS GRID */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isPopular = plan.isPopular;
            const costPerCredit = (plan.price / plan.credits).toFixed(2);

            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative rounded-3xl bg-[#0b0f19]/40 p-8 border text-left flex flex-col justify-between hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 ${
                  isPopular ? "border-blue-500/50 shadow-lg shadow-blue-500/5" : "border-white/5"
                }`}
              >
                {isPopular && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full flex items-center gap-1">
                    <Crown size={10} />
                    <span>Most Popular</span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Plan header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Zap size={14} className="fill-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">{plan.name}</h3>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">{plan.validityDays || 30} days validity</span>
                    </div>
                  </div>

                  {/* Pricing details */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-black text-white leading-none">₹{plan.price}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">One-Time Payment</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="font-semibold text-emerald-400">{plan.credits} Workspace Credits</span>
                      <span className="font-bold text-slate-500">₹{costPerCredit} / Credit</span>
                    </div>
                  </div>

                  {/* Included features */}
                  <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-slate-400 font-semibold">
                    {[
                      "AI Executive Summaries",
                      "Execution roadmap checkpoints",
                      "Concept notes markup formatting",
                      "Active recall practice quizzes",
                      "Standard PDF downloads",
                      "Native study language output",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Primary Razorpay Action Button */}
                <button
                  type="button"
                  onClick={() => handlePayment(plan)}
                  disabled={loadingPlanId === plan._id}
                  className={`w-full py-4 mt-8 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-250 flex items-center justify-center gap-2 outline-none ${
                    isPopular
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10 active:scale-98"
                      : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-200 active:scale-98"
                  } disabled:opacity-50`}
                >
                  {loadingPlanId === plan._id ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Initiating Razorpay...</span>
                    </>
                  ) : (
                    <span>Activate Plan</span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* TRUST SIGNALS */}
        <div className="grid md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
          {[
            {
              title: "Encrypted Transactions",
              desc: "Payments are processed securely via Razorpay under 256-bit SSL network encryption keys.",
            },
            {
              title: "Instant Active Balance",
              desc: "Credits compile and apply directly to your user workspace account within seconds.",
            },
            {
              title: "Robust Validity System",
              desc: "Credits remain fully active for 30 days. Balance extensions activate on top-up purchases.",
            },
          ].map((item, i) => (
            <div key={i} className="bg-[#0b0f19]/20 border border-white/5 rounded-3xl p-6 text-left space-y-3">
              <ShieldCheck className="text-blue-400 w-8 h-8" />
              <h4 className="text-sm font-black text-white">{item.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ ACCORDION SECTION */}
        <div className="max-w-3xl mx-auto space-y-6 pt-10 border-t border-white/5">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-black text-white tracking-tight">Billing FAQ</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="border border-white/10 rounded-2xl bg-[#0b0f19]/35 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-white font-bold text-sm md:text-base hover:bg-white/5 transition-colors focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 border-t border-white/5 text-slate-400 text-xs md:text-sm leading-relaxed text-left bg-black/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}