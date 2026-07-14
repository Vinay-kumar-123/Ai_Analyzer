"use client";

import {
  FiHelpCircle,
  FiCopy,
  FiCheck,
  FiDownload,
} from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Q&A Tab
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display AI generated Questions & Answers
 * • Copy Q&A
 * • Export PDF
 *
 * NEVER
 * - API Calls
 * - Polling
 * - Lazy Generation
 * - Business Logic
 * ============================================================================
 */

export default function QATab({
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const qa = Array.isArray(analysis.qa)
    ? analysis.qa
    : [];

  const copyText = qa
    .map(
      (item, index) =>
        `${index + 1}. ${item.question}\n\n${item.answer}`
    )
    .join("\n\n-----------------------------\n\n");

  /*
   * Loading
   */

  if (loading && !qa.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

        <h2 className="text-xl font-semibold">
          Generating Questions & Answers...
        </h2>

        <p className="mt-2 text-gray-400">
          AI is preparing interview and revision questions.
        </p>
      </div>
    );
  }

  /*
   * Empty
   */

  if (!qa.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
        <FiHelpCircle
          size={48}
          className="mx-auto mb-4 text-gray-500"
        />

        <h2 className="text-xl font-semibold">
          Q&A Not Available
        </h2>

        <p className="mt-2 text-gray-400">
          Open this tab after AI finishes generating Q&A.
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
            AI Questions & Answers
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Practice your understanding with AI-generated questions.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => copy(copyText, "qa")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            {copied === "qa"
              ? <FiCheck />
              : <FiCopy />}

            {copied === "qa"
              ? "Copied"
              : "Copy"}
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "qa",
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

      {/* Questions */}

      <div className="space-y-5">

        {qa.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
          >
            <div className="mb-4 flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                {index + 1}
              </div>

              <h3 className="font-semibold text-lg">
                {item.question}
              </h3>

            </div>

            <div className="rounded-xl bg-black/20 p-5">

              <p className="whitespace-pre-wrap leading-7 text-gray-200">
                {item.answer}
              </p>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}