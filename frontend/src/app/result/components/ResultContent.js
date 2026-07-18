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

const SummaryTab   = lazy(() => import("./tabs/SummaryTab"));
const KeyPointsTab = lazy(() => import("./tabs/KeyPointsTab"));
const NotesTab     = lazy(() => import("./tabs/NotesTab"));
const RoadmapTab   = lazy(() => import("./tabs/RoadmapTab"));
const QuizTab      = lazy(() => import("./tabs/QuizTab"));

const COMPONENTS = {
  summary:   SummaryTab,
  keypoints: KeyPointsTab,
  notes:     NotesTab,
  roadmap:   RoadmapTab,
  quiz:      QuizTab,
};

function LoadingFallback() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-gray-300">Loading section...</span>
      </div>
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
