"use client";

import { FiBook, FiCopy, FiCheck, FiDownload } from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Notes Tab
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display generated notes
 * • Display note sections
 * • Copy notes
 * • Export PDF
 *
 * NEVER
 * - API Calls
 * - Polling
 * - Lazy Generation
 * - Business Logic
 * ============================================================================
 */

export default function NotesTab({
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const notes = analysis.notes || "";

  const sections = Array.isArray(analysis.sections)
    ? analysis.sections
    : [];

  /*
   * Loading
   */

  if (loading && !notes) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

        <h2 className="text-xl font-semibold">
          Generating Notes...
        </h2>

        <p className="mt-2 text-gray-400">
          AI is preparing structured study notes.
        </p>
      </div>
    );
  }

  /*
   * Empty
   */

  if (!notes) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
        <FiBook
          size={48}
          className="mx-auto mb-4 text-gray-500"
        />

        <h2 className="text-xl font-semibold">
          Notes not available
        </h2>

        <p className="mt-2 text-gray-400">
          Open this tab after AI finishes generating notes.
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
            AI Notes
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Structured notes generated from the video.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => copy(notes, "notes")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            {copied === "notes"
              ? <FiCheck />
              : <FiCopy />}

            {copied === "notes"
              ? "Copied"
              : "Copy"}
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "notes",
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

      {/* Sections */}

      {sections.length > 0 && (
        <div className="space-y-4">

          {sections.map((section, index) => (

            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
            >

              <h3 className="mb-3 text-lg font-semibold">
                {section.title || `Section ${index + 1}`}
              </h3>

              <p className="whitespace-pre-wrap leading-8 text-gray-200">
                {section.content}
              </p>

            </div>

          ))}

        </div>
      )}

      {/* Full Notes */}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">

        <h3 className="mb-4 text-lg font-semibold">
          Complete Notes
        </h3>

        <div className="whitespace-pre-wrap leading-8 text-gray-200">
          {notes}
        </div>

      </div>

    </section>
  );
}