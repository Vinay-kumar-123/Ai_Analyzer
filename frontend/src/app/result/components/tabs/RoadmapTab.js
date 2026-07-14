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

export default function RoadmapTab({
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const roadmap = Array.isArray(analysis.roadmap)
    ? analysis.roadmap
    : [];

  const copyText = roadmap
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  /*
   * Loading
   */

  if (loading && !roadmap.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

        <h2 className="text-xl font-semibold">
          Generating Learning Roadmap...
        </h2>

        <p className="mt-2 text-gray-400">
          AI is creating your personalized learning path.
        </p>
      </div>
    );
  }

  /*
   * Empty
   */

  if (!roadmap.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
        <FiMap
          size={48}
          className="mx-auto mb-4 text-gray-500"
        />

        <h2 className="text-xl font-semibold">
          Roadmap Not Available
        </h2>

        <p className="mt-2 text-gray-400">
          Open this tab after AI finishes generating the roadmap.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            Learning Roadmap
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Follow these steps in order for the best learning experience.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => copy(copyText, "roadmap")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            {copied === "roadmap"
              ? <FiCheck />
              : <FiCopy />}

            {copied === "roadmap"
              ? "Copied"
              : "Copy"}
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "roadmap",
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

      {/* Roadmap */}

      <div className="space-y-4">

        {roadmap.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            {/* Step Number */}

            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {index + 1}
            </div>

            {/* Step */}

            <div className="flex-1">

              <p className="whitespace-pre-wrap leading-7 text-gray-200">
                {step}
              </p>

            </div>

            {/* Arrow */}

            {index !== roadmap.length - 1 && (
              <FiArrowRight className="mt-2 text-gray-500" />
            )}

          </div>
        ))}

      </div>

    </section>
  );
}