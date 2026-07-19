"use client";

import { FiCheckCircle, FiCopy, FiCheck, FiDownload } from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Key Points Tab
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display important learning points
 * • Copy all key points
 * • Export PDF
 *
 * NEVER
 * - API Calls
 * - Polling
 * - Lazy Generation
 * - Business Logic
 * ============================================================================
 */

import { Copy, Download, Check, CheckCircle2, Sparkles } from "lucide-react";

export default function KeyPointsTab({
  analysis,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const keyPoints = Array.isArray(analysis.keyPoints)
    ? analysis.keyPoints
    : [];

  const copyText = keyPoints.join("\n");

  return (
    <section className="space-y-6 text-left">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-400" />
            <span>Key Learning Points</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Crucial concepts and takeaways extracted directly from transcripts.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => copy(copyText, "keypoints")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19]/35 px-4.5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-white/5 hover:border-white/20 active:scale-98"
          >
            {copied === "keypoints" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied === "keypoints" ? "Copied" : "Copy Points"}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "keypoints",
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

      {/* Empty State */}
      {!keyPoints.length && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-slate-500">
          <CheckCircle2 size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No key points compiled for this video.</p>
        </div>
      )}

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div className="grid gap-4">
          {keyPoints.map((point, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-6 hover:border-white/10 hover:bg-[#0b0f19]/40 transition-all duration-200"
            >
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <span className="text-xs font-black">{index + 1}</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">takeaway {index + 1}</h3>
                <p className="leading-relaxed text-sm text-slate-300 whitespace-pre-wrap font-medium">
                  {point}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

    </section>
  );
}