"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Brain,
  Timer,
  ArrowRight,
  Layers3,
  Search,
  Trash2,
  ShieldAlert,
  ChevronDown,
  Globe,
  Target
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function AnalysisHistory({
  analyses = [],
  loading = false,
  pagination = {},
  page = 1,
  setPage,
  search = "",
  setSearch,
  statusFilter = "all",
  setStatusFilter,
  sortBy = "newest",
  setSortBy,
  languageFilter = "all",
  setLanguageFilter,
  goalFilter = "all",
  setGoalFilter,
  onDeleteSuccess
}) {
  const [deleteTarget, setDeleteTarget] = useState(null); // holds analysis object for delete modal
  const [deletingId, setDeletingId] = useState(null); // track currently deleting module id

  const modalRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  const getPageNumbers = (current, total) => {
    const pages = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleDeleteReal = async () => {
    if (!deleteTarget || deletingId) return;

    const id = deleteTarget._id;
    setDeletingId(id);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/history/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to delete from history.");
      }

      toast.success("Study module deleted successfully from history.");
      
      if (onDeleteSuccess) {
        onDeleteSuccess(id);
      }
    } catch (err) {
      console.error("Deletion error:", err);
      toast.error(err.message || "Failed to delete the study module. Please try again.");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  // Keyboard accessibility and focus trap handler
  useEffect(() => {
    if (deleteTarget) {
      // Save previously focused element
      lastActiveElementRef.current = document.activeElement;

      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !deletingId) {
          setDeleteTarget(null);
          return;
        }

        if (e.key === "Enter" && !deletingId) {
          handleDeleteReal();
          return;
        }

        if (e.key === "Tab") {
          if (!modalRef.current) return;
          const focusables = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex="0"]'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      // Focus first actionable element inside the modal
      setTimeout(() => {
        const firstBtn = modalRef.current?.querySelector("button");
        if (firstBtn) {
          firstBtn.focus();
        } else {
          modalRef.current?.focus();
        }
      }, 50);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        // Restore focus when closing
        lastActiveElementRef.current?.focus();
      };
    }
  }, [deleteTarget, deletingId]);

  // ─────────────────────────────────────────────────────────────
  // SKELETON LOADER (Avoid layout shifts)
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 md:p-10 shadow-sm text-left relative overflow-hidden space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-4 w-48 bg-slate-50 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="w-20 h-8 bg-slate-100 rounded-xl animate-pulse" />
        </div>

        {/* Filter Row Skeleton */}
        <div className="grid gap-3 grid-cols-12">
          <div className="col-span-12 md:col-span-4 h-11 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="col-span-6 md:col-span-2 h-11 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="col-span-6 md:col-span-2 h-11 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="col-span-6 md:col-span-2 h-11 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="col-span-6 md:col-span-2 h-11 bg-slate-100 rounded-2xl animate-pulse" />
        </div>

        {/* List Skeleton Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-slate-200/70 rounded-3xl p-5 md:p-6 bg-slate-50/20 flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-52 h-32 rounded-2xl bg-slate-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-4 py-1">
                <div className="h-5 w-3/4 bg-slate-100 rounded-lg animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-6 w-20 bg-slate-100 rounded-lg animate-pulse" />
                </div>
                <div className="h-4 w-40 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters = search || statusFilter !== "all" || languageFilter !== "all" || goalFilter !== "all";

  // ─────────────────────────────────────────────────────────────
  // EMPTY SEARCH MISMATH RESULT STATE
  // ─────────────────────────────────────────────────────────────
  if (analyses.length === 0 && hasActiveFilters) {
    const handleClearFilters = () => {
      setSearch("");
      setStatusFilter("all");
      setLanguageFilter("all");
      setGoalFilter("all");
      setSortBy("newest");
      setPage(1);
    };

    return (
      <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 md:p-10 shadow-sm text-left relative overflow-hidden">
        {/* Header Section */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Brain size={20} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                AI Analysis History
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-0.5">
                Review and study your previously processed learning video files.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-left">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">Total Logs</span>
            <span className="text-base font-black text-slate-800 mt-1 block">{pagination.total || 0} Modules</span>
          </div>
        </div>

        {/* Filter Controls Row (Keep filters active and visible so they can change them directly) */}
        <div className="relative z-10 grid gap-3 grid-cols-12 w-full mb-8">
          <div className="col-span-12 md:col-span-4 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search titles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-semibold text-slate-800 transition-all shadow-sm"
            />
          </div>

          <div className="col-span-6 md:col-span-2 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-bold text-slate-700 cursor-pointer shadow-sm"
            >
              <option value="all">Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="col-span-6 md:col-span-2 relative">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-bold text-slate-700 cursor-pointer shadow-sm"
            >
              <option value="all">Languages</option>
              <option value="english">English</option>
              <option value="hinglish">Hinglish</option>
              <option value="hindi">Hindi</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="col-span-6 md:col-span-2 relative">
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-bold text-slate-700 cursor-pointer shadow-sm"
            >
              <option value="all">Goals</option>
              <option value="student">Student</option>
              <option value="developer">Developer</option>
              <option value="job_seeker">Job Seeker</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="col-span-6 md:col-span-2 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-bold text-slate-700 cursor-pointer shadow-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-10 text-center max-w-lg mx-auto relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Search size={20} />
          </div>
          <h3 className="text-base font-black text-slate-800">No analyses found.</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
            We couldn't find any analyses matching your current search parameters. Try another term, clear active filters, or start a new video study session.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all active:scale-98"
            >
              Clear Filters
            </button>
            <Link
              href="/analyze"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-98"
            >
              Analyze New Video
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // GLOBAL EMPTY STATE (No logs generated at all)
  // ─────────────────────────────────────────────────────────────
  if (!analyses.length && !hasActiveFilters) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-[32px] p-10 md:p-16 text-center max-w-2xl mx-auto shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 pointer-events-none" />
        
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center mx-auto text-blue-600 shadow-sm relative z-10">
          <FileText size={22} />
        </div>

        <h2 className="text-2xl font-black mt-6 text-slate-900 tracking-tight relative z-10">
          No Analyses Created Yet
        </h2>

        <p className="text-slate-500 text-sm mt-3 max-w-md mx-auto leading-relaxed relative z-10">
          Your study dashboard is empty. Paste a YouTube tutorial URL inside the workspace analyzer to generate roadmap plans and review quizzes.
        </p>

        <div className="relative z-10">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/10 active:scale-98 transition-all duration-150"
          >
            <Sparkles size={14} className="text-yellow-400" />
            <span>Launch AI Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  const total = pagination.total || 0;
  const showingStart = total === 0 ? 0 : (page - 1) * (pagination.limit || 10) + 1;
  const showingEnd = Math.min((page - 1) * (pagination.limit || 10) + (pagination.limit || 10), total);

  // ─────────────────────────────────────────────────────────────
  // MAIN WRAPPER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 md:p-10 shadow-sm text-left relative overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Brain size={20} />
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              AI Analysis History
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">
              Review and study your previously processed learning video files.
            </p>
          </div>
        </div>

        {/* LOGS COUNTER BADGE */}
        <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-left">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">Total Logs</span>
          <span className="text-base font-black text-slate-800 mt-1 block">{total} Modules</span>
        </div>
      </div>

      {/* SEARCH + FILTER CONTROLS ROW */}
      <div className="relative z-10 grid gap-3 grid-cols-12 w-full mb-8">
        
        {/* Search Input */}
        <div className="col-span-12 md:col-span-4 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-semibold text-slate-800 transition-all shadow-sm"
          />
        </div>

        {/* Status dropdown */}
        <div className="col-span-6 md:col-span-2 relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-bold text-slate-700 cursor-pointer shadow-sm"
          >
            <option value="all">Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Language dropdown */}
        <div className="col-span-6 md:col-span-2 relative">
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-bold text-slate-700 cursor-pointer shadow-sm"
          >
            <option value="all">Languages</option>
            <option value="english">English</option>
            <option value="hinglish">Hinglish</option>
            <option value="hindi">Hindi</option>
            <option value="spanish">Spanish</option>
            <option value="french">French</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Study Goal dropdown */}
        <div className="col-span-6 md:col-span-2 relative">
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-bold text-slate-700 cursor-pointer shadow-sm"
          >
            <option value="all">Goals</option>
            <option value="student">Student</option>
            <option value="developer">Developer</option>
            <option value="job_seeker">Job Seeker</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort dropdown */}
        <div className="col-span-6 md:col-span-2 relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs md:text-sm font-bold text-slate-700 cursor-pointer shadow-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

      </div>

      {/* CARDS LIST CONTAINER */}
      <div className="relative z-10 space-y-4">
        {analyses.map((item, index) => {
          const isProcessing = item.status === "processing" || item.status === "queued";
          const isCompleted = item.status === "completed";
          const isFailed = item.status === "failed";

          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="group border border-slate-200/70 rounded-3xl overflow-hidden hover:border-slate-350 hover:shadow-md transition-all duration-300 bg-slate-50/30"
            >
              <div className="p-5 md:p-6">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">

                  {/* LEFT DETAILS ELEMENT */}
                  <div className="flex flex-col md:flex-row gap-5 flex-1">
                    
                    {/* VIDEO PREVIEW FRAME */}
                    <div className="relative w-full md:w-52 h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <FaYoutube size={36} className="text-slate-300" />
                        </div>
                      )}

                      {/* STATUS CORNER INDICATOR */}
                      <div className="absolute top-2.5 left-2.5 shadow-md">
                        {isProcessing && (
                          <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 leading-none">
                            <Loader2 size={8} className="animate-spin" />
                            <span>Processing</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 leading-none">
                            <CheckCircle2 size={8} />
                            <span>Completed</span>
                          </span>
                        )}
                        {isFailed && (
                          <span className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 leading-none">
                            <XCircle size={8} />
                            <span>Failed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CARD CORE SUMMARY DETAILS */}
                    <div className="flex-1 text-left space-y-3">
                      <h3 className="text-base md:text-lg font-bold text-slate-800 leading-snug tracking-tight group-hover:text-blue-600 transition-colors">
                        {item.videoTitle || "Untitled Learning Module"}
                      </h3>

                      {/* Configurations tags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Globe size={10} className="text-slate-400" />
                          <span>{item.language || "english"}</span>
                        </span>
                        <span className="bg-blue-50 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Target size={10} className="text-blue-500" />
                          <span>{item.goal || "student"}</span>
                        </span>
                        {item.contentType && (
                          <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {item.contentType}
                          </span>
                        )}
                      </div>

                      {/* Created date & complexity metrics */}
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })
                              : "--"}
                          </span>
                        </div>

                        {item.processingTime > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Timer size={12} />
                            <span>{Math.floor(item.processingTime / 1000)}s build</span>
                          </div>
                        )}

                        {item.keyPoints?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Layers3 size={12} />
                            <span>{item.keyPoints.length} points</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT ACTION CONTROLS */}
                  <div className="flex xl:flex-col gap-2 w-full xl:w-44 xl:self-center">
                    {isCompleted ? (
                      <Link
                        href={`/result/${item._id}`}
                        className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 active:scale-98 transition-all flex-1 xl:flex-none"
                      >
                        <span>Study Notes</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex-1 xl:flex-none">
                        {isProcessing ? "Analyzing..." : "Unusable"}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={deletingId === item._id}
                      onClick={() => setDeleteTarget(item)}
                      className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-250 text-slate-500 font-bold text-xs py-2.5 px-4 rounded-xl active:scale-98 transition-all flex-1 xl:flex-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === item._id ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-rose-500" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={12} />
                          <span>Delete Module</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* PAGINATION FOOTER */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="font-bold text-slate-800">{showingStart}–{showingEnd}</span> of{" "}
            <span className="font-bold text-slate-800">{total}</span> analyses
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous Page"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-98"
            >
              <ArrowRight size={14} className="rotate-180 text-slate-600" />
            </button>

            {getPageNumbers(page, pagination.totalPages).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                aria-label={`Page ${n}`}
                aria-current={page === n ? "page" : undefined}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-98 ${
                  page === n
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "border border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              aria-label="Next Page"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-98"
            >
              <ArrowRight size={14} className="text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* DELETE DIALOG MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!deletingId) setDeleteTarget(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal core window */}
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 shadow-2xl text-left focus:outline-none"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Delete Analysis Module?</h3>
                  <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
                    This will remove this analysis from your personal history.
                    If other users have analyzed the same video, their analyses will not be affected.
                  </p>
                </div>
              </div>

              {/* VIDEO MODULE INFO CARD */}
              <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                <div className="relative w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-200">
                  {deleteTarget.thumbnail ? (
                    <img
                      src={deleteTarget.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <FaYoutube size={20} className="text-slate-350" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2 text-left">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                    {deleteTarget.videoTitle || deleteTarget.title || "Untitled Learning Module"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                      {deleteTarget.language || "english"}
                    </span>
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                      {deleteTarget.goal || "student"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={deletingId !== null}
                  onClick={() => setDeleteTarget(null)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-250 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xs text-slate-700 transition-all border border-slate-200/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingId !== null}
                  onClick={handleDeleteReal}
                  className="w-1/2 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/15"
                >
                  {deletingId ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-white" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Permanently</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
