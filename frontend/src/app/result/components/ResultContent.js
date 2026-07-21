"use client";

import React, { Suspense, lazy, useMemo } from "react";

/**
 * ============================================================================
 * AI Learning OS
 * Result Content
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Render the active tab component
 * • Lazy-load tab components for bundle splitting
 * • Provide a loading fallback
 *
 * MVP Tabs: Summary · Key Points · Notes · Roadmap · Quiz
 *
 * This component NEVER:
 * - Calls APIs
 * - Manages polling
 * - Contains business logic
 * - Knows about lazy generation
 * ============================================================================
 */

const SummaryTab    = lazy(() => import("./tabs/SummaryTab"));
const KeyPointsTab  = lazy(() => import("./tabs/KeyPointsTab"));
const RevisionTab   = lazy(() => import("./tabs/RevisionTab"));
const NotesTab      = lazy(() => import("./tabs/NotesTab"));
const RoadmapTab    = lazy(() => import("./tabs/RoadmapTab"));
const QuizTab       = lazy(() => import("./tabs/QuizTab"));
const FlashcardsTab = lazy(() => import("./tabs/FlashcardsTab"));
const AITutorTab    = lazy(() => import("./tabs/AITutorTab"));

const COMPONENTS = {
  summary:    SummaryTab,
  keypoints:  KeyPointsTab,
  revision:   RevisionTab,
  notes:      NotesTab,
  roadmap:    RoadmapTab,
  quiz:       QuizTab,
  flashcards: FlashcardsTab,
  tutor:      AITutorTab,
};

function LoadingFallback() {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-8 space-y-6 animate-pulse text-left">
      <div className="h-6 bg-white/10 rounded-lg w-1/4" />
      <div className="space-y-3">
        <div className="h-4 bg-white/5 rounded-lg w-full" />
        <div className="h-4 bg-white/5 rounded-lg w-5/6" />
        <div className="h-4 bg-white/5 rounded-lg w-4/6" />
      </div>
      <div className="h-40 bg-white/5 rounded-2xl w-full" />
    </div>
  );
}

export default function ResultContent({
  activeTab,
  analysis,
  loading,
  copy,
  copied,
  buildPDF,
}) {
  const ActiveComponent = useMemo(
    () => COMPONENTS[activeTab] ?? SummaryTab,
    [activeTab],
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ActiveComponent
        analysis={analysis}
        loading={loading}
        copy={copy}
        copied={copied}
        buildPDF={buildPDF}
      />
    </Suspense>
  );
}
