"use client";

import { FiClock, FiFileText, FiTag } from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Result Header
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display analysis metadata
 * • Display title
 * • Display content type
 * • Display transcript length
 * • Display processing status
 *
 * This component NEVER:
 * - Calls APIs
 * - Manages state
 * - Generates content
 * - Contains business logic
 * ============================================================================
 */

export default function ResultHeader({ analysis }) {
  if (!analysis) return null;

  const {
    title,
    contentType,
    transcriptLength,
    processingTime,
    status,
  } = analysis;

  return (
    <header className="mb-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">

      {/* Title */}
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">
          {title || "AI Analysis"}
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          AI generated learning content
        </p>
      </div>

      {/* Metadata */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Content Type */}
        <div className="rounded-xl bg-black/20 p-4 border border-white/10">
          <div className="flex items-center gap-2 text-indigo-400">
            <FiTag size={18} />
            <span className="text-xs uppercase tracking-wide">
              Content
            </span>
          </div>

          <p className="mt-2 font-medium capitalize">
            {contentType || "General"}
          </p>
        </div>

        {/* Transcript */}
        <div className="rounded-xl bg-black/20 p-4 border border-white/10">
          <div className="flex items-center gap-2 text-emerald-400">
            <FiFileText size={18} />
            <span className="text-xs uppercase tracking-wide">
              Transcript
            </span>
          </div>

          <p className="mt-2 font-medium">
            {transcriptLength
              ? transcriptLength.toLocaleString()
              : "--"}{" "}
            chars
          </p>
        </div>

        {/* Processing */}
        <div className="rounded-xl bg-black/20 p-4 border border-white/10">
          <div className="flex items-center gap-2 text-yellow-400">
            <FiClock size={18} />
            <span className="text-xs uppercase tracking-wide">
              Processing
            </span>
          </div>

          <p className="mt-2 font-medium">
            {processingTime
              ? `${Math.round(processingTime / 1000)} sec`
              : "--"}
          </p>
        </div>

        {/* Status */}
        <div className="rounded-xl bg-black/20 p-4 border border-white/10">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

            <span className="text-xs uppercase tracking-wide">
              Status
            </span>
          </div>

          <p className="mt-2 font-medium capitalize">
            {status || "Completed"}
          </p>
        </div>

      </div>
    </header>
  );
}