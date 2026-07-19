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

import { useState } from "react";
import { Award, Check, Copy, Download, RefreshCw, HelpCircle, Loader2, X } from "lucide-react";

export default function QuizTab({
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const quiz = Array.isArray(analysis.quiz) ? analysis.quiz : [];
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }

  const totalQuestions = quiz.length;
  const answeredCount = Object.keys(userAnswers).length;
  
  const correctCount = quiz.reduce((sum, item, idx) => {
    return userAnswers[idx] === item.correctAnswerIndex ? sum + 1 : sum;
  }, 0);

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

  /* Loading State */
  if (loading && !quiz.length) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-12 text-center space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
        <h2 className="text-lg font-black text-white">Generating Quiz...</h2>
        <p className="text-xs text-slate-500">AI model is framing concept verification cards.</p>
      </div>
    );
  }

  /* Empty State */
  if (!quiz.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center space-y-4 text-slate-500">
        <Award size={36} className="mx-auto opacity-30" />
        <h2 className="text-sm font-semibold">Quiz Not Available</h2>
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
            <Award size={18} className="text-yellow-400" />
            <span>AI Practice Quiz</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Interactive multiple choice questions to verify information retention.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => copy(copyText, "quiz")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19]/35 px-4.5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-white/5 hover:border-white/20 active:scale-98"
          >
            {copied === "quiz" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied === "quiz" ? "Copied" : "Copy Quiz"}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "quiz",
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

      {/* SCORE BANNER */}
      {answeredCount > 0 && (
        <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-none">Practice Scoreboard</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                Answered {answeredCount} of {totalQuestions} questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-base font-black text-blue-400">
              {correctCount} / {totalQuestions} Correct
            </span>
            <button
              type="button"
              onClick={() => setUserAnswers({})}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold transition-all"
            >
              <RefreshCw size={12} />
              <span>Reset Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {quiz.map((item, index) => {
          const selectedOption = userAnswers[index];
          const hasAnswered = selectedOption !== undefined;

          return (
            <div
              key={index}
              className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-6 md:p-8 space-y-5"
            >
              {/* Question Header */}
              <div className="flex items-start gap-3.5">
                <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20 text-xs font-black text-blue-400">
                  {index + 1}
                </div>
                <h3 className="text-sm md:text-base font-bold text-white leading-snug">
                  {item.question}
                </h3>
              </div>

              {/* Options Grid */}
              <div className="grid gap-3 pl-10">
                {(item.options || []).map((option, optionIndex) => {
                  const letters = ["A", "B", "C", "D"];
                  const isCorrect = optionIndex === item.correctAnswerIndex;
                  const isSelected = optionIndex === selectedOption;

                  let cardStyle = "border-white/5 bg-[#080a12]/30 text-slate-300 hover:border-white/20 hover:scale-[1.005] transition-all cursor-pointer";
                  let indicatorIcon = null;

                  if (hasAnswered) {
                    if (isCorrect) {
                      cardStyle = "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-semibold";
                      indicatorIcon = <Check size={14} className="text-emerald-400 flex-shrink-0" />;
                    } else if (isSelected) {
                      cardStyle = "border-rose-500/20 bg-rose-500/10 text-rose-400 font-semibold";
                      indicatorIcon = <X size={14} className="text-rose-400 flex-shrink-0" />;
                    } else {
                      cardStyle = "border-white/5 bg-[#080a12]/10 text-slate-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => {
                        setUserAnswers((prev) => ({
                          ...prev,
                          [index]: optionIndex,
                        }));
                      }}
                      className={`w-full flex items-center justify-between text-left rounded-2xl border p-4 text-xs md:text-sm font-semibold outline-none ${cardStyle}`}
                    >
                      <span className="leading-relaxed">
                        <span className="text-slate-500 font-black mr-2">{letters[optionIndex]}.</span>
                        {option}
                      </span>
                      {indicatorIcon}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}