"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

import {
  motion,
} from "framer-motion";

import {
  Brain,
  BarChart3,
  Zap,
  Sparkles,
  ArrowRight,
  Clock3,
  CreditCard,
  Target,
  TrendingUp,
  Layers3,
  PlusCircle,
  Loader2,
} from "lucide-react";

import toast from "react-hot-toast";

import Navbar from "@/components/Navbar";

import AnalysisHistory from "@/components/AnalysisHistory";

import { useAuth } from "@/contexts/AuthContext";

const API =
  process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  // ======================================================
  // AUTH
  // ======================================================

  const {
    user,
    loading,
  } = useAuth();

  const router = useRouter();

  // ======================================================
  // STATE
  // ======================================================

  const [stats, setStats] =
    useState(null);

  const [credits, setCredits] =
    useState(0);

  const [history, setHistory] =
    useState([]);

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);

  // ======================================================
  // AUTH GUARD
  // ======================================================

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [
    user,
    loading,
    router,
  ]);

  // ======================================================
  // FETCH
  // ======================================================

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData =
    async () => {
      setPageLoading(true);

      try {
        const [
          statsRes,
          creditRes,
          historyRes,
        ] = await Promise.all([
          fetch(
            `${API}/api/dashboard/stats`,
            {
              credentials:
                "include",
            }
          ),

          fetch(
            `${API}/api/dashboard/credits`,
            {
              credentials:
                "include",
            }
          ),

          fetch(
            `${API}/api/dashboard/history?page=1&limit=5`,
            {
              credentials:
                "include",
            }
          ),
        ]);

        const statsData =
          await statsRes.json();

        const creditData =
          await creditRes.json();

        const historyData =
          await historyRes.json();

        setStats(
          statsData.data
        );

        setCredits(
          creditData.data
            ?.credits || 0
        );

        setHistory(
          historyData.data
            ?.analyses || []
        );

      } catch (err) {
        console.log(err);

        toast.error(
          "Failed to load dashboard"
        );

      } finally {
        setPageLoading(false);
      }
    };

  // ======================================================
  // LOADING
  // ======================================================

  if (
    loading ||
    pageLoading
  ) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        <div className="text-center">

          <Loader2 className="w-14 h-14 animate-spin mx-auto text-blue-500" />

          <h2 className="text-2xl font-bold mt-6">
            Loading AI Dashboard...
          </h2>

          <p className="text-gray-400 mt-2">
            Preparing your learning workspace
          </p>

        </div>

      </div>
    );
  }

  if (!user) return null;

  // ======================================================
  // STATS CARDS
  // ======================================================

  const cards = [
    {
      title:
        "Total Analyses",

      value:
        stats?.totalAnalyses ||
        0,

      icon: BarChart3,

      color:
        "from-blue-500 to-indigo-600",
    },

    {
      title: "Usage",

      value:
        stats?.usageCount ||
        0,

      icon: Target,

      color:
        "from-purple-500 to-pink-600",
    },

    {
      title:
        "Learning Sessions",

      value:
        history.length,

      icon: Layers3,

      color:
        "from-green-500 to-emerald-600",
    },

    {
      title:
        "AI Credits",

      value: credits,

      icon: CreditCard,

      color:
        "from-orange-500 to-red-500",
    },
  ];

  // ======================================================
  // MAIN
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ======================================================
            HERO
        ====================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-8 md:p-12 shadow-2xl"
        >
          {/* BG */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_40%)]" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10">

            {/* LEFT */}
            <div className="max-w-3xl">

              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur mb-6">

                <Sparkles size={18} />

                AI Learning OS

              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
                Welcome back,
                <br />
                {user.name || "User"} 🚀
              </h1>

              <p className="text-blue-100 text-lg mt-6 leading-8 max-w-2xl">
                Turn YouTube videos into
                premium AI-generated
                notes, roadmaps,
                execution plans and
                interview preparation.
              </p>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-4 mt-10">

                <Link
                  href="/analyze"
                  className="bg-white text-black px-6 py-4 rounded-2xl font-semibold flex items-center gap-2 hover:scale-105 transition"
                >
                  <PlusCircle size={18} />

                  Analyze Video
                </Link>

                <Link
                  href="/buy-credits"
                  className="bg-black/20 border border-white/20 backdrop-blur px-6 py-4 rounded-2xl font-semibold flex items-center gap-2"
                >
                  <Zap size={18} />

                  Buy Credits
                </Link>

              </div>

            </div>

            {/* RIGHT */}
            <div className="grid grid-cols-2 gap-4 min-w-[320px]">

              {cards.map(
                (
                  card,
                  index
                ) => {
                  const Icon =
                    card.icon;

                  return (
                    <motion.div
                      key={
                        card.title
                      }

                      initial={{
                        opacity: 0,
                        scale: 0.9,
                      }}

                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}

                      transition={{
                        delay:
                          index *
                          0.1,
                      }}

                      className={`rounded-3xl bg-gradient-to-r ${card.color} p-5 shadow-lg`}
                    >
                      <Icon className="w-8 h-8 text-white/90" />

                      <div className="mt-5">

                        <div className="text-white/80 text-sm">
                          {
                            card.title
                          }
                        </div>

                        <div className="text-4xl font-bold mt-2">
                          {
                            card.value
                          }
                        </div>

                      </div>

                    </motion.div>
                  );
                }
              )}

            </div>

          </div>

        </motion.div>

        {/* ======================================================
            LOW CREDIT WARNING
        ====================================================== */}

        {credits <= 2 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            className="mt-8 bg-yellow-50 border border-yellow-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-5"
          >
            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center">

                <Zap className="text-yellow-600" />

              </div>

              <div>

                <h3 className="text-xl font-bold">
                  Low Credits Remaining
                </h3>

                <p className="text-gray-600 mt-1">
                  Your AI credits are
                  running low. Recharge
                  now to continue using
                  premium analysis.
                </p>

              </div>

            </div>

            <Link
              href="/buy-credits"
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-2xl font-semibold"
            >
              Buy Credits
            </Link>

          </motion.div>
        )}

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <div className="grid lg:grid-cols-3 gap-6 mt-10">

          {/* ANALYZE */}
          <motion.div
            whileHover={{
              y: -5,
            }}

            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">

              <Brain className="text-blue-600" />

            </div>

            <h3 className="text-2xl font-bold mt-6">
              Analyze Video
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Generate premium AI notes,
              roadmap, QA, project ideas
              and deep learning material.
            </p>

            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 mt-8 text-blue-600 font-semibold"
            >
              Start Analysis

              <ArrowRight size={18} />
            </Link>

          </motion.div>

          {/* CREDIT */}
          <motion.div
            whileHover={{
              y: -5,
            }}

            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">

              <CreditCard className="text-purple-600" />

            </div>

            <h3 className="text-2xl font-bold mt-6">
              AI Credits
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Purchase credits to unlock
              deep AI analysis and
              premium learning features.
            </p>

            <Link
              href="/buy-credits"
              className="inline-flex items-center gap-2 mt-8 text-purple-600 font-semibold"
            >
              Upgrade Now

              <ArrowRight size={18} />
            </Link>

          </motion.div>

          {/* ACTIVITY */}
          <motion.div
            whileHover={{
              y: -5,
            }}

            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">

              <TrendingUp className="text-green-600" />

            </div>

            <h3 className="text-2xl font-bold mt-6">
              Learning Progress
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Track your AI learning
              journey and monitor your
              educational growth.
            </p>

            <div className="mt-8 flex items-center gap-3">

              <Clock3 className="text-gray-400" />

              <span className="text-gray-700">
                {
                  history.length
                }{" "}
                recent analyses
              </span>

            </div>

          </motion.div>

        </div>

        {/* ======================================================
            HISTORY
        ====================================================== */}

        <div className="mt-12">

          <AnalysisHistory
            analyses={history}
          />

        </div>

      </div>

    </div>
  );
}