"use client";

import { FiCopy, FiDownload, FiCheck } from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Summary Tab
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display AI summary
 * • Display learning outcome
 * • Copy summary
 * • Export PDF
 *
 * NEVER
 * - API Calls
 * - Polling
 * - Lazy Generation
 * - Business Logic
 * ============================================================================
 */

export default function SummaryTab({
  analysis,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const {
    summary = "",
    outcome = "",
    contentType = "General",
  } = analysis;

  return (
    <section className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            AI Summary
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Quick understanding of the complete video.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={() => copy(summary, "summary")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            {copied === "summary"
              ? <FiCheck />
              : <FiCopy />
            }

            {copied === "summary"
              ? "Copied"
              : "Copy"}
          </button>

          <button
            onClick={() =>
              buildPDF({
                type: "summary",
                data: analysis,
              })
            }
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 transition hover:bg-indigo-500"
          >
            <FiDownload />

            PDF
          </button>

        </div>

      </div>

      {/* Summary */}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">

        <h3 className="mb-4 text-lg font-semibold">
          Summary
        </h3>

        <p className="leading-8 whitespace-pre-wrap text-gray-200">
          {summary || "Summary not available."}
        </p>

      </div>

      {/* Learning Outcome */}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">

        <h3 className="mb-4 text-lg font-semibold">
          Learning Outcome
        </h3>

        <p className="leading-8 whitespace-pre-wrap text-gray-200">
          {outcome || "Outcome not available."}
        </p>

      </div>

      {/* Content Type */}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">

        <h3 className="mb-4 text-lg font-semibold">
          Content Type
        </h3>

        <span className="inline-flex rounded-full bg-indigo-600/20 px-4 py-2 text-sm font-medium text-indigo-300">
          {contentType}
        </span>

      </div>

    </section>
  );
}