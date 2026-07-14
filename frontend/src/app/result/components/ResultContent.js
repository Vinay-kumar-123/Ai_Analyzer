"use client";

import React, { Suspense, lazy, useMemo } from "react";

/**
 * ============================================================================
 * AI Learning OS
 * Result Content
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Render active tab
 * • Lazy load tab components
 * • Loading fallback
 *
 * NEVER
 * - API Calls
 * - Polling
 * - Business Logic
 * - State Management
 * ============================================================================
 */

/*
|--------------------------------------------------------------------------
| Lazy Tab Components
|--------------------------------------------------------------------------
*/

const SummaryTab = lazy(() => import("./tabs/SummaryTab"));
const KeyPointsTab = lazy(() => import("./tabs/KeyPointsTab"));
const NotesTab = lazy(() => import("./tabs/NotesTab"));
const ActionsTab = lazy(() => import("./tabs/ActionsTab"));
const RoadmapTab = lazy(() => import("./tabs/RoadmapTab"));
const QATab = lazy(() => import("./tabs/QATab"));
const QuizTab = lazy(() => import("./tabs/QuizTab"));

const COMPONENTS = {
  summary: SummaryTab,
  keypoints: KeyPointsTab,
  notes: NotesTab,
  actions: ActionsTab,
  roadmap: RoadmapTab,
  qa: QATab,
  quiz: QuizTab,
};

function LoadingFallback() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-gray-300">
          Loading section...
        </span>
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
  const ActiveComponent = useMemo(() => {
    return COMPONENTS[activeTab] || SummaryTab;
  }, [activeTab]);

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