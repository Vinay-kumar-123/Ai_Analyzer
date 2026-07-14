"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

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
} from "lucide-react";

import { FaYoutube } from "react-icons/fa";

import { motion } from "framer-motion";

export default function AnalysisHistory({ analyses = [] }) {
  // ─────────────────────────────────────────────────────────────
  // SEARCH + FILTER
  // ─────────────────────────────────────────────────────────────

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ─────────────────────────────────────────────────────────────
  // FILTERED ANALYSES
  // ─────────────────────────────────────────────────────────────

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      const matchesSearch = item.videoTitle
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [analyses, search, statusFilter]);
  // ======================================================
  // EMPTY STATE
  // ======================================================

  if (!analyses.length) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10">
        <div className="text-center py-10">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
            <FileText className="text-blue-600" size={40} />
          </div>

          <h2 className="text-3xl font-bold mt-6 text-gray-900">
            No Analyses Yet
          </h2>

          <p className="text-gray-500 mt-3 max-w-lg mx-auto leading-7">
            Start analyzing YouTube videos to generate premium AI notes,
            roadmaps, execution plans and deep explanations.
          </p>

          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            <Sparkles size={18} />
            Start AI Analysis
          </Link>
        </div>
      </div>
    );
  }

  // ======================================================
  // MAIN
  // ======================================================

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Brain className="text-blue-600" size={28} />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              AI Analysis History
            </h2>

            <p className="text-gray-500 mt-1">
              Your premium AI generated learning sessions
            </p>
          </div>
        </div>

        {/* COUNT */}
        <div className="bg-gray-100 px-5 py-3 rounded-2xl">
          <div className="text-sm text-gray-500">Total Analyses</div>

          <div className="text-2xl font-bold">{analyses.length}</div>
        </div>
      </div>
      {/* SEARCH + FILTERS */}
      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
        <input
          type="text"
          placeholder="Search analyses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-72"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="queued">Queued</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      {/* ======================================================
          LIST
      ====================================================== */}
      <div className="space-y-5">
        {filteredAnalyses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-2xl font-bold text-gray-800">
              No matching analyses
            </div>

            <p className="text-gray-500 mt-2">
              Try changing your search or filter.
            </p>
          </div>
        )}
        {filteredAnalyses.map((item, index) => {
          const isProcessing =
            item.status === "processing" || item.status === "queued";

          const isCompleted = item.status === "completed";

          const isFailed = item.status === "failed";

          return (
            <motion.div
              key={item._id}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              className="group border border-gray-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all bg-white"
            >
              <div className="p-6">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                  {/* ======================================================
                        LEFT
                    ====================================================== */}

                  <div className="flex gap-5 flex-1">
                    {/* THUMBNAIL */}
                    <div className="relative">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt="thumbnail"
                          width={400}
                          height={225}
                          className="w-48 h-28 object-cover rounded-2xl border"
                        />
                      ) : (
                        <div className="w-48 h-28 rounded-2xl bg-gray-100 flex items-center justify-center">
                          <FaYoutube className="text-red-500" size={42} />
                        </div>
                      )}

                      {/* STATUS BADGE */}
                      <div className="absolute top-2 left-2">
                        {isProcessing && (
                          <div className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow">
                            <Loader2 size={12} className="animate-spin" />
                            Processing
                          </div>
                        )}

                        {isCompleted && (
                          <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow">
                            <CheckCircle2 size={12} />
                            Completed
                          </div>
                        )}

                        {isFailed && (
                          <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow">
                            <XCircle size={12} />
                            Failed
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INFO */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 leading-snug">
                        {item.videoTitle || "Untitled Video"}
                      </h3>

                      {/* META */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-sm font-medium">
                          {item.language || "english"}
                        </div>

                        <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-xl text-sm font-medium capitalize">
                          {item.goal || "student"}
                        </div>

                        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-xl text-sm font-medium capitalize">
                          {item.contentType || "general"}
                        </div>
                      </div>

                      {/* DATE */}
                      <div className="flex flex-wrap gap-5 mt-5 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock size={16} />

                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : "N/A"}
                        </div>

                        {item.processingTime > 0 && (
                          <div className="flex items-center gap-2">
                            <Timer size={16} />
                            {Math.floor(item.processingTime / 1000)} sec
                          </div>
                        )}

                        {item.keyPoints?.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Layers3 size={16} />
                            {item.keyPoints?.length} key points
                          </div>
                        )}
                      </div>

                      {/* SUMMARY */}
                      {item.summary && (
                        <div className="mt-5 bg-gray-50 rounded-2xl p-5 border">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            AI Summary
                          </h4>

                          <p className="text-gray-700 leading-7 line-clamp-4">
                            {item.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ======================================================
                        RIGHT
                    ====================================================== */}

                  <div className="flex flex-col gap-3 min-w-[220px]">
                    {/* MAIN BUTTON */}

                    {isCompleted ? (
                      <Link
                        href={`/result/${item._id}`}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-2xl transition shadow-lg"
                      >
                        Continue Learning
                        <ArrowRight size={18} />
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-2 bg-gray-200 text-gray-600 font-semibold px-5 py-3 rounded-2xl">
                        {isProcessing ? "AI Processing..." : "Analysis Failed"}
                      </div>
                    )}

                    {/* YOUTUBE */}
                    {item.youtubeUrl && (
                      <a
                        href={item.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 border border-gray-300 hover:border-red-400 hover:text-red-500 px-5 py-3 rounded-2xl transition"
                      >
                        <FaYoutube />
                        Open YouTube
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
