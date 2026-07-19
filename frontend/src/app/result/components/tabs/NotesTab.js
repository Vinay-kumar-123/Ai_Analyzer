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

import { BookOpen, Copy, Download, Check, Sparkles, BookText } from "lucide-react";

const renderFormattedNotes = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(">")) {
      return (
        <blockquote key={idx} className="border-l-4 border-blue-500 pl-4 py-1.5 my-4 italic text-slate-300 text-sm leading-relaxed">
          {trimmed.replace(">", "").trim()}
        </blockquote>
      );
    }
    if (trimmed.startsWith("###")) {
      return (
        <h3 key={idx} className="text-sm font-black text-white mt-6 mb-3 uppercase tracking-wider">
          {trimmed.replace("###", "").trim()}
        </h3>
      );
    }
    if (trimmed.startsWith("##")) {
      return (
        <h2 key={idx} className="text-base font-black text-white mt-8 mb-4 tracking-tight border-b border-white/5 pb-2">
          {trimmed.replace("##", "").trim()}
        </h2>
      );
    }
    if (trimmed.startsWith("#")) {
      return (
        <h1 key={idx} className="text-lg font-black text-white mt-10 mb-6 tracking-tight">
          {trimmed.replace("#", "").trim()}
        </h1>
      );
    }
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return (
        <ul key={idx} className="list-disc pl-6 my-2 text-slate-300 text-sm leading-relaxed">
          <li>{trimmed.replace(/^[-*]\s*/, "")}</li>
        </ul>
      );
    }
    if (trimmed.startsWith("```")) {
      return null;
    }
    if (trimmed === "") {
      return <div key={idx} className="h-3" />;
    }

    const parts = trimmed.split("`");
    if (parts.length > 1) {
      return (
        <p key={idx} className="leading-relaxed text-sm text-slate-300 my-3 font-medium">
          {parts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return (
                <code key={pIdx} className="bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-blue-400 font-mono text-xs mx-0.5">
                  {part}
                </code>
              );
            }
            return part;
          })}
        </p>
      );
    }

    return (
      <p key={idx} className="leading-relaxed text-sm text-slate-300 my-3 font-medium">
        {trimmed}
      </p>
    );
  });
};

export default function NotesTab({
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  if (!analysis) return null;

  const notes = analysis.notes || "";
  const sections = Array.isArray(analysis.sections) ? analysis.sections : [];

  /* Loading State */
  if (loading && !notes) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-12 text-center space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
        <h2 className="text-lg font-black text-white">Generating Notes...</h2>
        <p className="text-xs text-slate-500">AI model is compiling video speech details.</p>
      </div>
    );
  }

  /* Empty State */
  if (!notes) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center space-y-4 text-slate-500">
        <BookText size={36} className="mx-auto opacity-30" />
        <h2 className="text-sm font-semibold">Notes Not Available</h2>
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
            <BookOpen size={18} className="text-blue-400" />
            <span>Structured Study Notes</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Comprehensive markdown explanations matching your selected study goal.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => copy(notes, "notes")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19]/35 px-4.5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-white/5 hover:border-white/20 active:scale-98"
          >
            {copied === "notes" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied === "notes" ? "Copied" : "Copy Notes"}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              buildPDF({
                type: "notes",
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

      {/* Dynamic Sections if available */}
      {sections.length > 0 && (
        <div className="grid gap-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-6 md:p-8"
            >
              <h3 className="text-base font-black text-white mb-4 border-b border-white/5 pb-2">
                {section.title || `Section ${index + 1}`}
              </h3>
              <div className="space-y-1">
                {renderFormattedNotes(section.content)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Notes Area */}
      <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-6 md:p-8">
        <h3 className="text-base font-black text-white mb-6 border-b border-white/5 pb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-400" />
          <span>Complete Notes Document</span>
        </h3>
        <div className="space-y-1">
          {renderFormattedNotes(notes)}
        </div>
      </div>

    </section>
  );
}