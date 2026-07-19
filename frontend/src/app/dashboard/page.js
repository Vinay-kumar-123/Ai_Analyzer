"use client";

import {
  useEffect,
  useState,
  Suspense,
} from "react";

import {
  useRouter,
  useSearchParams,
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

function DashboardContent() {
  // ======================================================
  // AUTH
  // ======================================================

  const {
    user,
    loading,
  } = useAuth();

  const router = useRouter();

  const searchParams = useSearchParams();

  // ======================================================
  // DERIVED STATE (Single source of truth from URL params)
  // ======================================================
  const currentPage = parseInt(searchParams.get("page"), 10) || 1;
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const languageFilter = searchParams.get("language") || "all";
  const goalFilter = searchParams.get("goal") || "all";
  const sortBy = searchParams.get("sortBy") || "newest";

  // Local state for the search text input (for debouncing updates)
  const [searchInput, setSearchInput] = useState(search);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [credits, setCredits] = useState(0);
  const [history, setHistory] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // ======================================================
  // AUTH GUARD
  // ======================================================
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // ======================================================
  // URL SEARCHPARAM SYNCS & DEBOUNCING
  // ======================================================
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        const newParams = new URLSearchParams(window.location.search);
        if (searchInput.trim()) {
          newParams.set("search", searchInput.trim());
        } else {
          newParams.delete("search");
        }
        newParams.set("page", "1"); // Reset page when query changes
        router.push(`/dashboard?${newParams.toString()}`);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, search, router]);

  const handleFilterChange = (key, val) => {
    const newParams = new URLSearchParams(window.location.search);
    if (val === "all" || !val) {
      newParams.delete(key);
    } else {
      newParams.set(key, val);
    }
    if (key !== "page") {
      newParams.set("page", "1"); // Reset page on filter shifts
    }
    router.push(`/dashboard?${newParams.toString()}`);
  };

  // ======================================================
  // FETCHERS
  // ======================================================
  const fetchDashboardData = async () => {
    setPageLoading(true);
    try {
      const [statsRes, creditRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`, { credentials: "include" }),
        fetch(`${API}/api/dashboard/credits`, { credentials: "include" }),
      ]);

      const statsData = await statsRes.json();
      const creditData = await creditRes.json();

      if (statsData.success) setStats(statsData.data);
      if (creditData.success) setCredits(creditData.data?.credits || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard metrics.");
    } finally {
      setPageLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    setHistoryLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search,
        status: statusFilter,
        language: languageFilter,
        goal: goalFilter,
        sortBy,
      });

      const res = await fetch(`${API}/api/dashboard/history?${query.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.data.analyses || []);
        setPagination(data.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    try {
      const [statsRes, creditRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`, { credentials: "include" }),
        fetch(`${API}/api/dashboard/credits`, { credentials: "include" }),
      ]);

      const statsData = await statsRes.json();
      const creditData = await creditRes.json();

      if (statsData.success) setStats(statsData.data);
      if (creditData.success) setCredits(creditData.data?.credits || 0);
    } catch (err) {
      console.error("Silent background refresh failed:", err);
    }
  };

  // Trigger stats load once on auth success
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Trigger history fetch when filter deps change
  useEffect(() => {
    if (user) {
      fetchHistoryData();
    }
  }, [user, currentPage, search, statusFilter, languageFilter, goalFilter, sortBy]);

  const handleDeleteSuccess = (id) => {
    // 1. Optimistically remove deleted element immediately
    setHistory((prev) => prev.filter((item) => item._id !== id));
    
    // 2. Adjust target page fallback if last element on page is deleted
    if (history.length === 1 && currentPage > 1) {
      handleFilterChange("page", (currentPage - 1).toString());
    } else {
      fetchHistoryData();
    }
    
    // 3. Update stats in the background
    refreshDashboardData();
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
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">

        {/* ======================================================
            HERO SECTION
        ====================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-14 shadow-xl border border-white/5"
        >
          {/* Radial ambient glow bg */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#4f46e5,transparent_45%)] pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-12 items-center">

            {/* LEFT (WELCOME INFO) */}
            <div className="max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md mb-6 text-sm font-bold text-indigo-200">
                <Sparkles size={15} className="text-yellow-400" />
                <span>AI Learning Workspace</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Welcome back,
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  {user.name || "User"}
                </span> 👋
              </h1>

              <p className="text-slate-300 text-base md:text-lg mt-6 leading-relaxed max-w-xl">
                Convert standard YouTube videos into production-grade structured study notes, roadmap outlines, coding challenges, and mock interview preparations.
              </p>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  href="/analyze"
                  className="bg-white text-slate-950 px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-100 hover:shadow-lg hover:-translate-y-0.5 active:scale-98 transition-all duration-200"
                >
                  <PlusCircle size={18} />
                  <span>Analyze Video</span>
                </Link>

                <Link
                  href="/buy-credits"
                  className="bg-white/10 border border-white/10 backdrop-blur px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/15 hover:-translate-y-0.5 active:scale-98 transition-all duration-200"
                >
                  <Zap size={18} className="text-yellow-400" />
                  <span>Buy Credits</span>
                </Link>
              </div>
            </div>

            {/* RIGHT (STATS GRID) */}
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto min-w-[320px] max-w-md">
              {cards.map((card, index) => {
                const Icon = card.icon;

                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08 }}
                    className="relative group overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-5 shadow-lg backdrop-blur-sm hover:border-white/20 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/90">
                        <Icon size={16} />
                      </div>
                    </div>

                    <div className="mt-6 text-left">
                      <div className="text-white/60 text-xs font-bold uppercase tracking-wider">
                        {card.title}
                      </div>
                      <div className="text-3xl font-black tracking-tight mt-1 text-white leading-none">
                        {card.value}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </motion.div>

        {/* ======================================================
            LOW CREDIT WARNING (IF APPLICABLE)
        ====================================================== */}
        {credits <= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                <Zap size={20} className="fill-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Low Credits Alert
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  You only have {credits} credits left. Upgrade your credits quota now to maintain uninterrupted access to our deep learning video analyses.
                </p>
              </div>
            </div>

            <Link
              href="/buy-credits"
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-sm active:scale-98 transition-all duration-150 flex-shrink-0"
            >
              Recharge Quota
            </Link>
          </motion.div>
        )}

        {/* ======================================================
            QUICK ACTIONS GRID
        ====================================================== */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">

          {/* ANALYZE CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8 text-left hover:border-blue-500/20 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-500/10">
                <Brain size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-6">
                Analyze Video
              </h3>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Provide any educational YouTube video link to extract deep synthesis reports, key study concepts, custom roadmaps, and programming projects.
              </p>
            </div>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 mt-8 text-blue-600 font-bold text-sm group"
            >
              <span>Launch analysis workspace</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* CREDITS CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8 text-left hover:border-purple-500/20 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-500/10">
                <CreditCard size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-6">
                Credits Balance
              </h3>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Review available credit parameters and buy learning slots. Top up your balance securely via credit card, UPI, or net banking methods.
              </p>
            </div>
            <Link
              href="/buy-credits"
              className="inline-flex items-center gap-2 mt-8 text-purple-600 font-bold text-sm group"
            >
              <span>Add study credits</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* PROGRESS CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8 text-left hover:border-emerald-500/20 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-500/10">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-6">
                Workspace History
              </h3>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Review and manage your analyzed materials. Revisit existing flashcards, edit previous notes, or study roadmaps on previously created records.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <Clock3 size={16} className="text-slate-400" />
                <span>{stats?.totalAnalyses || 0} completed logs</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ======================================================
            HISTORY LISTING
        ====================================================== */}
        <div className="mt-14">
          <AnalysisHistory
            analyses={history}
            loading={historyLoading}
            pagination={pagination}
            page={currentPage}
            setPage={(p) => handleFilterChange("page", p.toString())}
            search={searchInput}
            setSearch={setSearchInput}
            statusFilter={statusFilter}
            setStatusFilter={(s) => handleFilterChange("status", s)}
            sortBy={sortBy}
            setSortBy={(sort) => handleFilterChange("sortBy", sort)}
            languageFilter={languageFilter}
            setLanguageFilter={(l) => handleFilterChange("language", l)}
            goalFilter={goalFilter}
            setGoalFilter={(g) => handleFilterChange("goal", g)}
            onDeleteSuccess={handleDeleteSuccess}
          />
        </div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-14 h-14 animate-spin mx-auto text-blue-500" />
          <h2 className="text-2xl font-bold mt-6">Loading AI Dashboard...</h2>
          <p className="text-slate-400 mt-2">Preparing your learning workspace</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}