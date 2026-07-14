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
    <section className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            Key Learning Points
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Most important concepts extracted from the video.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => copy(copyText, "keypoints")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            {copied === "keypoints"
              ? <FiCheck />
              : <FiCopy />
            }

            {copied === "keypoints"
              ? "Copied"
              : "Copy"}
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "keypoints",
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

      {/* Empty State */}

      {!keyPoints.length && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-gray-400">
          No key points available.
        </div>
      )}

      {/* Key Points */}

      {keyPoints.length > 0 && (
        <div className="space-y-4">

          {keyPoints.map((point, index) => (

            <div
              key={index}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
            >

              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400">

                <FiCheckCircle size={18} />

              </div>

              <div>

                <h3 className="mb-1 font-semibold">
                  Point {index + 1}
                </h3>

                <p className="leading-7 text-gray-200 whitespace-pre-wrap">
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