"use client";

import React, { useMemo } from "react";
import {
  Zap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Award,
  Sparkles,
} from "lucide-react";

/**
 * ============================================================================
 * AI Learning OS
 * ⚡ 5-Minute Revision Tab — v1
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Exam-ready, 5-minute rapid revision view generated 100% IN-MEMORY from
 * existing stored content:
 *   Knowledge Core → Notes Sections → Flashcards → Key Points / Summary
 *
 * ZERO OPENAI CALLS. ZERO ADDITIONAL DB STORAGE.
 * Clean, compact, mobile-responsive layout.
 * ============================================================================
 */

export default function RevisionTab({ analysis }) {
  const revisionData = useMemo(() => {
    if (!analysis) return null;
    const kc         = analysis.knowledgeCore || {};
    const sections   = Array.isArray(analysis.sections) ? analysis.sections : [];
    const flashcards = Array.isArray(analysis.flashcards) ? analysis.flashcards : [];
    const keyPoints  = Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [];
    const summary    = analysis.summary || "";
    const outcome    = analysis.outcome || "";

    // 1. Main Topic
    const mainTopic = analysis.videoTitle || "Core Concepts & Fundamentals";

    // 2. Key Concepts (from Knowledge Core or high-importance sections)
    const concepts = Array.isArray(kc.concepts) && kc.concepts.length > 0
      ? kc.concepts.slice(0, 5).map((c) => ({ name: c.name, desc: c.explanation }))
      : sections.slice(0, 4).map((s) => ({ name: s.title, desc: s.content.slice(0, 150) + "..." }));

    // 3. Most Important Points (from keyPoints or sections)
    const importantPoints = keyPoints.length > 0
      ? keyPoints.slice(0, 6)
      : sections.slice(0, 5).map((s) => `${s.title}: ${s.content.slice(0, 100)}`);

    // 4. Common Mistakes (from Knowledge Core or section warnings)
    const commonMistakes = Array.isArray(kc.commonMistakes) && kc.commonMistakes.length > 0
      ? kc.commonMistakes.slice(0, 4)
      : sections
          .filter((s) => s.type === "warning" || s.type === "interview")
          .map((s) => `${s.title}: ${s.content.slice(0, 120)}`)
          .slice(0, 3);

    // 5. Memory Tricks & Terms (from Knowledge Core definitions/glossary or flashcards)
    const memoryTricks = Array.isArray(kc.definitions) && kc.definitions.length > 0
      ? kc.definitions.slice(0, 4).map((d) => ({ term: d.term, meaning: d.definition }))
      : flashcards.filter((f) => f.type === "definition").slice(0, 4).map((f) => ({ term: f.question, meaning: f.answer }));

    // 6. Interview / Viva Questions (from Knowledge Core or flashcards)
    const interviewQuestions = Array.isArray(kc.interviewInsights) && kc.interviewInsights.length > 0
      ? kc.interviewInsights.slice(0, 4)
      : flashcards.slice(0, 4).map((f) => f.question);

    // 7. 30-Second Rapid Bullets
    const rapidBullets = importantPoints.slice(0, 4);

    // 8. One-Line Takeaway
    const takeaway = outcome || summary.slice(0, 200) || "Master the core principles and apply them systematically.";

    return {
      mainTopic,
      concepts,
      importantPoints,
      commonMistakes,
      memoryTricks,
      interviewQuestions,
      rapidBullets,
      takeaway,
    };
  }, [analysis]);

  return (
    <section className="space-y-6 text-left" aria-label="5-Minute Exam Revision">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
            <Zap size={12} />
            <span>5-Minute Exam Mode</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {revisionData.mainTopic}
          </h2>
          <p className="text-xs text-slate-400">
            Exam-ready summary, high-yield takeaways & viva prep
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl shrink-0">
          <Clock size={14} className="text-amber-400" />
          <span>Est. Reading: 3-5 mins</span>
        </div>
      </div>

      {/* ── ONE-LINE TAKEAWAY BANNER ───────────────────────── */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 flex items-start gap-3 text-xs md:text-sm text-blue-200">
        <Sparkles size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white font-bold block mb-0.5">One-Line Exam Takeaway:</strong>
          <span>{revisionData.takeaway}</span>
        </div>
      </div>

      {/* ── TWO-COLUMN GRID ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KEY CONCEPTS */}
        <div className="rounded-3xl border border-white/10 bg-[#0b0f19] p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
            <BookOpen size={16} className="text-blue-400" />
            <span>Key Concepts</span>
          </h3>
          <div className="space-y-3">
            {revisionData.concepts.map((c, idx) => (
              <div key={idx} className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-1">
                <h4 className="text-xs font-bold text-blue-300">{c.name}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MOST IMPORTANT POINTS */}
        <div className="rounded-3xl border border-white/10 bg-[#0b0f19] p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>High-Yield Points</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {revisionData.importantPoints.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-emerald-400 font-bold font-mono">✓</span>
                <span className="leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* COMMON MISTAKES */}
        {revisionData.commonMistakes.length > 0 && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-4">
            <h3 className="text-sm font-black text-rose-300 uppercase tracking-wider flex items-center gap-2 border-b border-rose-500/10 pb-3">
              <AlertTriangle size={16} className="text-rose-400" />
              <span>Common Mistakes to Avoid</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {revisionData.commonMistakes.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  <span className="text-rose-400 font-bold">⚠️</span>
                  <span className="leading-relaxed">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* MEMORY TRICKS & KEY TERMS */}
        {revisionData.memoryTricks.length > 0 && (
          <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
            <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2 border-b border-purple-500/10 pb-3">
              <Award size={16} className="text-purple-400" />
              <span>Key Terms & Anchors</span>
            </h3>
            <div className="space-y-2">
              {revisionData.memoryTricks.map((t, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-xs">
                  <span className="font-bold text-purple-300">{t.term}</span>
                  <span className="text-slate-400 text-[11px]">{t.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERVIEW / VIVA QUESTIONS */}
        {revisionData.interviewQuestions.length > 0 && (
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4 md:col-span-2">
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-amber-500/10 pb-3">
              <HelpCircle size={16} className="text-amber-400" />
              <span>Rapid Viva / Interview Questions</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-200">
              {revisionData.interviewQuestions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <span className="text-amber-400 font-bold font-mono">Q{idx + 1}.</span>
                  <span className="leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 30-SECOND RAPID SUMMARY ────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-[#0b0f19] p-6 space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <span>30-Second Final Recall Checklist</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {revisionData.rapidBullets.map((bullet, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 font-medium">
              <span className="text-blue-400">#</span>
              <span>{bullet}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
