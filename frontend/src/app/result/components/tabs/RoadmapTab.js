"use client";

import {
  FiMap,
  FiCopy,
  FiCheck,
  FiDownload,
  FiArrowRight,
} from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Roadmap Tab
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display learning roadmap
 * • Copy roadmap
 * • Export PDF
 *
 * NEVER
 * - API Calls
 * - Polling
 * - Lazy Generation
 * - Business Logic
 * ============================================================================
 */

import { useState } from "react";
import { Compass, Copy, Download, Check, ArrowRight, Loader2, Award } from "lucide-react";

export default function RoadmapTab({
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const roadmap = Array.isArray(analysis.roadmap) ? analysis.roadmap : [];
  const [completedSteps, setCompletedSteps] = useState({}); // { [stepIdx]: boolean }

  const totalSteps = roadmap.length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  const copyText = roadmap
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  /* Loading State */
  if (loading && !roadmap.length) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-12 text-center space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
        <h2 className="text-lg font-black text-white">Generating Roadmap...</h2>
        <p className="text-xs text-slate-500">AI model is mapping progressive skill levels.</p>
      </div>
    );
  }

  /* Empty State */
  if (!roadmap.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center space-y-4 text-slate-500">
        <Compass size={36} className="mx-auto opacity-30" />
        <h2 className="text-sm font-semibold">Roadmap Not Available</h2>
        <p className="text-xs">Workspace is awaiting AI content synthesis completion.</p>
      </div>
    );
  }

  return (
    <section className="space-y-6 text-left">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Compass size={18} className="text-emerald-400" />
            <span>Personalized Learning Roadmap</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Click on step cards to mark milestones completed as you progress.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => copy(copyText, "roadmap")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19]/35 px-4.5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-white/5 hover:border-white/20 active:scale-98"
          >
            {copied === "roadmap" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied === "roadmap" ? "Copied" : "Copy Path"}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "roadmap",
                data: analysis,
              })
            }
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4.5 py-2.5 text-xs font-bold text-white transition-all active:scale-98 shadow-md shadow-blue-500/10"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* PROGRESS SCORE BOARD */}
      {totalSteps > 0 && (
        <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/20 p-6 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white leading-none">Your Study Progress</h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Completed {completedCount} of {totalSteps} milestones
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-emerald-400">
              {Math.round((completedCount / totalSteps) * 100)}% Complete
            </span>
          </div>
        </div>
      )}

      {/* Learning Timeline steps */}
      <div className="relative space-y-6 pl-10 md:pl-12">
        {/* Timeline vertical connecting line */}
        <div className="absolute left-[19px] md:left-[21px] top-6 bottom-6 w-[2px] bg-white/5 pointer-events-none" />

        {roadmap.map((step, index) => {
          const isCompleted = completedSteps[index] === true;

          return (
            <div
              key={index}
              onClick={() => {
                setCompletedSteps((prev) => ({
                  ...prev,
                  [index]: !prev[index],
                }));
              }}
              className={`relative flex flex-col md:flex-row items-start md:items-center gap-4 rounded-3xl border p-6 bg-[#0b0f19]/30 transition-all duration-200 cursor-pointer select-none ${
                isCompleted 
                  ? "border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/20" 
                  : "border-white/5 hover:border-white/10 hover:bg-[#0b0f19]/40"
              }`}
            >
              {/* Stepper Node Indicator */}
              <div className={`absolute -left-[51px] md:-left-[53px] w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5"
                  : "bg-slate-900 border-white/10 text-slate-400"
              }`}>
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <span className="text-xs font-black">{index + 1}</span>
                )}
              </div>

              {/* Step Card Content */}
              <div className="flex-1 space-y-1 text-left">
                <h4 className={`text-[10px] font-black uppercase tracking-widest ${
                  isCompleted ? "text-emerald-500/80" : "text-blue-400"
                }`}>
                  Milestone {index + 1}
                </h4>
                <p className={`leading-relaxed text-sm transition-all duration-200 ${
                  isCompleted 
                    ? "text-slate-500 line-through decoration-slate-700 font-medium" 
                    : "text-slate-300 font-semibold"
                }`}>
                  {step}
                </p>
              </div>

              {/* Completion CTA arrow */}
              <div className="flex-shrink-0 self-end md:self-center mt-3 md:mt-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-xl ${
                  isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-400"
                }`}>
                  {isCompleted ? "Completed" : "Mark Done"}
                </span>
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}