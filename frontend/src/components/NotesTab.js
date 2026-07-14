"use client";

import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBookOpen, FiDownload, FiCopy, FiCheck, FiChevronDown, FiChevronRight,
  FiAlertTriangle, FiCode, FiZap, FiBriefcase, FiStar, FiRefreshCw,
  FiList, FiTarget, FiEye, FiMenu, FiX,
} from "react-icons/fi";

// ── Section type config ────────────────────────────────────────────────────────
const SECTION_TYPE_CONFIG = {
  introduction: { label: "Introduction",   icon: FiBookOpen,      badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/30",  cardClass: "border-orange-500/15 bg-orange-500/[0.03]"   },
  core_concept: { label: "Core Concept",   icon: FiStar,          badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",  cardClass: "border-indigo-500/15 bg-indigo-500/[0.03]"   },
  example:      { label: "Example",        icon: FiEye,           badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",cardClass: "border-emerald-500/15 bg-emerald-500/[0.03]" },
  advanced:     { label: "Advanced",       icon: FiZap,           badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/30",  cardClass: "border-violet-500/15 bg-violet-500/[0.03]"   },
  interview:    { label: "Interview Prep", icon: FiBriefcase,     badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",    cardClass: "border-amber-500/15 bg-amber-500/[0.03]"     },
  revision:     { label: "Quick Revision", icon: FiList,          badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/30",          cardClass: "border-sky-500/15 bg-sky-500/[0.03]"         },
  warning:      { label: "Warning",        icon: FiAlertTriangle, badgeClass: "bg-red-500/20 text-red-300 border-red-500/30",          cardClass: "border-red-500/15 bg-red-500/[0.03]"         },
  summary:      { label: "Summary",        icon: FiTarget,        badgeClass: "bg-gray-500/20 text-gray-300 border-gray-500/30",       cardClass: "border-gray-500/15 bg-gray-500/[0.03]"       },
  code:         { label: "Code",           icon: FiCode,          badgeClass: "bg-green-500/20 text-green-300 border-green-500/30",    cardClass: "border-green-500/15 bg-[#0d1117]"            },
  project:      { label: "Project",        icon: FiZap,           badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",cardClass: "border-emerald-500/20 bg-emerald-500/[0.05]"},
  quiz:         { label: "Quiz",           icon: FiRefreshCw,     badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30", cardClass: "border-purple-500/15 bg-purple-500/[0.03]"   },
};

const DEFAULT_CONFIG = SECTION_TYPE_CONFIG.core_concept;

// ── Prose styling ──────────────────────────────────────────────────────────────
const proseClass = `
  prose prose-invert max-w-none
  prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
  prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
  prose-p:text-gray-300 prose-p:leading-8 prose-p:text-sm
  prose-li:text-gray-300 prose-li:leading-7 prose-li:text-sm
  prose-strong:text-white prose-strong:font-semibold
  prose-em:text-indigo-300
  prose-code:text-green-300 prose-code:bg-white/8 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
  prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:text-xs
  prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:rounded-r-xl prose-blockquote:text-gray-400
  prose-a:text-indigo-400 prose-a:no-underline
  prose-hr:border-white/10
`.trim();

// ── CopyBtn ────────────────────────────────────────────────────────────────────
const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [text]);

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied ? "bg-emerald-500/20 text-emerald-400" : "bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white"
      }`}
    >
      {copied ? <FiCheck className="text-xs" /> : <FiCopy className="text-xs" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

// ── Sidebar entry ──────────────────────────────────────────────────────────────
const SidebarEntry = ({ section, index, isActive, onScrollTo }) => {
  const config = SECTION_TYPE_CONFIG[section.type] || DEFAULT_CONFIG;
  const Icon = config.icon;
  return (
    <button
      onClick={() => onScrollTo(index)}
      className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-xl transition-all ${
        isActive ? "bg-indigo-500/15 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
      }`}
    >
      <Icon className={`flex-shrink-0 text-xs mt-1 ${isActive ? "text-indigo-400" : "text-gray-600"}`} />
      <span className={`text-xs leading-snug ${section.importance === "high" ? "font-semibold" : "font-normal"}`}>
        {section.title}
      </span>
    </button>
  );
};

// ── Section card ───────────────────────────────────────────────────────────────
const SectionCard = ({ section, index, isActive, sectionRef }) => {
  const [collapsed, setCollapsed] = useState(false);
  const localRef = useRef(null);

  useEffect(() => {
    if (sectionRef && typeof sectionRef === "object") {
      sectionRef.current = localRef.current;
    }
  }, [sectionRef]);

  const config = SECTION_TYPE_CONFIG[section.type] || DEFAULT_CONFIG;
  const Icon   = config.icon;

  return (
    <motion.div
      ref={localRef}
      id={`section-${index}`}
      data-section-idx={String(index)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      className={`rounded-2xl border overflow-hidden transition-all ${config.cardClass} ${
        isActive ? "ring-1 ring-indigo-500/30" : ""
      }`}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 px-6 py-4 cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0 mt-0.5 ${config.badgeClass}`}>
            <Icon className="text-xs" />
            {config.label}
          </span>
          <h3 className={`text-white leading-snug pt-0.5 ${section.importance === "high" ? "text-sm font-bold" : "text-sm font-semibold"}`}>
            {section.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <CopyBtn text={section.content} />
          <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
            {collapsed ? <FiChevronRight className="text-xs" /> : <FiChevronDown className="text-xs" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className={proseClass}>
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Legacy fallback ────────────────────────────────────────────────────────────
const LegacyNotesRenderer = ({ notes, onDownload }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <p className="text-xs text-gray-500">Structured sections unavailable — showing full notes</p>
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors"
      >
        <FiDownload /> PDF
      </button>
    </div>
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 ${proseClass}`}>
      <ReactMarkdown>{notes}</ReactMarkdown>
    </div>
  </div>
);

// ======================================================
// MAIN
// ======================================================
const NotesTab = ({ data, onDownloadPDF }) => {
  const [activeSection,  setActiveSection]  = useState(0);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [readingPercent, setReadingPercent] = useState(0);

  const observerRef  = useRef(null);
  const sectionRefs  = useRef([]);

  const sections = useMemo(() => {
    if (Array.isArray(data?.sections) && data.sections.length > 0) {
      return data.sections;
    }
    return [];
  }, [data]);

  const hasSections = sections.length > 0;

  // Initialise ref array when section count changes
  useEffect(() => {
    sectionRefs.current = sections.map((_, idx) =>
      sectionRefs.current[idx] || { current: null },
    );
  }, [sections]);

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) { setReadingPercent(100); return; }
      setReadingPercent(Math.min(100, Math.round((scrollTop / scrollable) * 100)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver for active section tracking
  useEffect(() => {
    if (!hasSections) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let visible = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.sectionIdx || "0", 10);
            if (visible === null || idx < visible) visible = idx;
          }
        }
        if (visible !== null) setActiveSection(visible);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    sectionRefs.current.forEach((refObj) => {
      if (refObj?.current && observerRef.current) {
        observerRef.current.observe(refObj.current);
      }
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [hasSections, sections.length]);

  // Scroll to section
  const scrollToSection = useCallback((idx) => {
    const el = document.getElementById(`section-${idx}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setSidebarOpen(false);
  }, []);

  // Legacy fallback
  if (!hasSections) {
    return <LegacyNotesRenderer notes={data?.notes || ""} onDownload={onDownloadPDF} />;
  }

  return (
    <div className="relative">

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-white/5 pointer-events-none">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
          style={{ width: `${readingPercent}%` }}
        />
      </div>

      {/* Mobile toggle */}
      <div className="lg:hidden mb-4 flex justify-between items-center">
        <span className="text-sm text-gray-400">{sections.length} chapters</span>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-sm text-gray-300 transition-colors"
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
          {sidebarOpen ? "Close" : "Chapters"}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden mb-6 rounded-2xl border border-white/10 bg-[#0e1118] p-3 max-h-64 overflow-y-auto"
          >
            <div className="flex flex-col gap-0.5">
              {sections.map((section, idx) => (
                <SidebarEntry
                  key={idx}
                  section={section}
                  index={idx}
                  isActive={activeSection === idx}
                  onScrollTo={scrollToSection}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout */}
      <div className="flex gap-8 items-start">

        {/* Sticky sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto gap-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Chapters</span>
            <span className="text-xs text-gray-600">{sections.length}</span>
          </div>

          {sections.map((section, idx) => (
            <SidebarEntry
              key={idx}
              section={section}
              index={idx}
              isActive={activeSection === idx}
              onScrollTo={scrollToSection}
            />
          ))}

          {/* Progress */}
          <div className="mt-5 px-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>Reading</span>
              <span>{readingPercent}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                style={{ width: `${readingPercent}%` }}
              />
            </div>
          </div>

          {/* Download */}
          <button
            onClick={onDownloadPDF}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/8 hover:bg-white/12 text-gray-300 hover:text-white transition-colors border border-white/8"
          >
            <FiDownload className="text-xs" /> Download Notes
          </button>
        </aside>

        {/* Section cards */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {sections.map((section, idx) => (
            <SectionCard
              key={`${section.title}-${idx}`}
              section={section}
              index={idx}
              isActive={activeSection === idx}
              sectionRef={sectionRefs.current[idx]}
            />
          ))}

          {/* End marker */}
          <div className="py-8 text-center border-t border-white/5">
            <p className="text-xs text-gray-600">
              ✓ End of notes · {sections.length} chapter{sections.length !== 1 ? "s" : ""} covered
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(NotesTab);

