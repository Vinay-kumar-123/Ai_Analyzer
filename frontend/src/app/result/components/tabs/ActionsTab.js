"use client";

import {
  FiZap,
  FiCopy,
  FiCheck,
  FiDownload,
} from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Actions Tab
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display AI action steps
 * • Copy actions
 * • Export PDF
 *
 * NEVER
 * - API Calls
 * - Polling
 * - Lazy Generation
 * - Business Logic
 * ============================================================================
 */

export default function ActionsTab({
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const actions = Array.isArray(analysis.actionSteps)
    ? analysis.actionSteps
    : [];

  const copyText = actions.join("\n");

  /*
   * Loading
   */

  if (loading && !actions.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

        <h2 className="text-xl font-semibold">
          Generating Action Plan...
        </h2>

        <p className="mt-2 text-gray-400">
          AI is creating practical action steps.
        </p>
      </div>
    );
  }

  /*
   * Empty
   */

  if (!actions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
        <FiZap
          size={48}
          className="mx-auto mb-4 text-gray-500"
        />

        <h2 className="text-xl font-semibold">
          No Action Plan Available
        </h2>

        <p className="mt-2 text-gray-400">
          Open this tab after AI finishes generating actions.
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
            AI Action Plan
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Practical next steps generated from the video.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => copy(copyText, "actions")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            {copied === "actions"
              ? <FiCheck />
              : <FiCopy />}

            {copied === "actions"
              ? "Copied"
              : "Copy"}
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "actions",
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

      {/* Actions */}

      <div className="space-y-4">

        {actions.map((action, index) => (
          <div
            key={index}
            className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 font-semibold text-indigo-300">
              {index + 1}
            </div>

            <div className="flex-1">
              <p className="whitespace-pre-wrap leading-7 text-gray-200">
                {action}
              </p>
            </div>
          </div>
        ))}

      </div>

    </section>
  );
}