"use client";

import {
  FiAward,
  FiCheck,
  FiCopy,
  FiDownload,
} from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Quiz Tab
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display AI generated quiz
 * • Show MCQs
 * • Show correct answers
 * • Copy quiz
 * • Export PDF
 *
 * NEVER
 * - API Calls
 * - Polling
 * - Lazy Generation
 * - Business Logic
 * ============================================================================
 */

export default function QuizTab({
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const quiz = Array.isArray(analysis.quiz)
    ? analysis.quiz
    : [];

  const copyText = quiz
    .map((item, index) => {
      return [
        `${index + 1}. ${item.question}`,
        `A. ${item.options?.[0] || ""}`,
        `B. ${item.options?.[1] || ""}`,
        `C. ${item.options?.[2] || ""}`,
        `D. ${item.options?.[3] || ""}`,
        `Answer: ${item.options?.[item.correctAnswerIndex] || ""}`,
      ].join("\n");
    })
    .join("\n\n-------------------------\n\n");

  /*
   * Loading
   */

  if (loading && !quiz.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

        <h2 className="text-xl font-semibold">
          Generating Quiz...
        </h2>

        <p className="mt-2 text-gray-400">
          AI is preparing practice questions.
        </p>
      </div>
    );
  }

  /*
   * Empty
   */

  if (!quiz.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
        <FiAward
          size={48}
          className="mx-auto mb-4 text-gray-500"
        />

        <h2 className="text-xl font-semibold">
          Quiz Not Available
        </h2>

        <p className="mt-2 text-gray-400">
          Open this tab after AI finishes generating quiz questions.
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
            AI Quiz
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Test your understanding with AI-generated MCQs.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => copy(copyText, "quiz")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            {copied === "quiz"
              ? <FiCheck />
              : <FiCopy />}

            {copied === "quiz"
              ? "Copied"
              : "Copy"}
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "quiz",
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

      {/* Quiz */}

      <div className="space-y-6">

        {quiz.map((item, index) => (

          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
          >

            <div className="mb-5 flex items-start gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                {index + 1}
              </div>

              <h3 className="text-lg font-semibold">
                {item.question}
              </h3>

            </div>

            <div className="space-y-3">

              {(item.options || []).map((option, optionIndex) => {

                const letters = ["A", "B", "C", "D"];

                const isCorrect =
                  optionIndex === item.correctAnswerIndex;

                return (
                  <div
                    key={optionIndex}
                    className={`rounded-xl border p-4 ${
                      isCorrect
                        ? "border-green-500 bg-green-500/10"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <span className="font-semibold">
                      {letters[optionIndex]}.
                    </span>{" "}
                    {option}
                  </div>
                );
              })}

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}