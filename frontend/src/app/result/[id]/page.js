"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import ResultLayout  from "@/app/result/components/ResultLayout";
import ResultHeader  from "@/app/result/components/ResultHeader";
import ResultTabs    from "@/app/result/components/ResultTabs";
import ResultContent from "@/app/result/components/ResultContent";

import { usePolling }        from "@/app/result/hooks/usePolling";
import { useResultState }    from "@/app/result/hooks/useResultState";
import { useTabManager }     from "@/app/result/hooks/useTabManager";
import { useLazyGeneration, analysisHasContent } from "@/app/result/hooks/useLazyGeneration";

import { getAnalysis } from "@/app/result/services/resultApi";

import { useAuth } from "@/contexts/AuthContext";
import {
  LoadingScreen,
  FailedScreen,
  ErrorScreen,
} from "@/components/ResultScreens";

import { usePdfExport } from "@/app/result/hooks/usePdfExport";

/**
 * ============================================================================
 * AI Learning OS
 * Result Page — Orchestrator
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Load analysis on mount (once)
 * • Poll until analysis is completed / failed
 * • Trigger lazy tab generation on tab switch
 * • Connect all hooks and pass data down
 * • Render layout shell
 *
 * NEVER
 * - Render tab content directly
 * - Implement API logic
 * - Contain business logic
 *
 * GENERATE EFFECT DESIGN
 * ----------------------
 * The generate effect depends on [activeTab, currentTab] — NOT on analysis.
 *
 * Why?
 * analysis changes every time mergeAnalysis() is called by onSuccess.
 * If analysis were in the effect deps, every successful generation would:
 *   1. Call mergeAnalysis → new analysis reference
 *   2. Effect re-runs → generate() called again
 *   3. generate() is a no-op (already generated) but still re-evaluates
 *   4. In degraded cases this can loop or cause unnecessary work
 *
 * generate() reads analysis internally via analysisRef (always fresh).
 * There is no need for analysis to be an effect dependency.
 *
 * POLLING CALLBACK DESIGN
 * -----------------------
 * handlePollingUpdate and handlePollingError are stabilised with useCallback
 * and have minimal deps.  usePolling stores them in refs internally, so
 * the polling loop never restarts due to callback identity changes.
 *
 * ============================================================================
 */

export default function ResultPage() {
  const { id }   = useParams();
  const router   = useRouter();

  /* -------------------------------------------------------------------------
  | State
  |-------------------------------------------------------------------------- */

  const {
    analysis,
    loading,
    error,
    replaceAnalysis,
    mergeAnalysis,
    setLoading,
    setError,
  } = useResultState();

  /* -------------------------------------------------------------------------
  | PDF Export
  |-------------------------------------------------------------------------- */

  const { buildPDF } = usePdfExport();

  /* -------------------------------------------------------------------------
  | Tabs
  |-------------------------------------------------------------------------- */

  const { activeTab, currentTab, visibleTabs, changeTab } =
    useTabManager(analysis);

  /* -------------------------------------------------------------------------
  | Initial Load
  |-------------------------------------------------------------------------- */

  /**
   * initializedRef prevents the initial load from firing twice in React
   * StrictMode, where effects run twice on mount.
   */
  const initializedRef = useRef(false);

  const loadAnalysis = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const result = await getAnalysis(id);

      if (result.status === 401) {
        router.push("/login");
        return;
      }

      if (!result.success) {
        throw new Error(result.message || "Unable to load analysis.");
      }

      replaceAnalysis(result.data);
    } catch (err) {
      setError(err.message || "Unable to load analysis.");
    } finally {
      setLoading(false);
    }
  }, [id, router, replaceAnalysis, setLoading, setError]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void loadAnalysis();
  }, [loadAnalysis]);

  /* -------------------------------------------------------------------------
  | Polling
  |-------------------------------------------------------------------------- */

  const shouldPoll = useMemo(() => {
    return (
      analysis?.status === "queued" ||
      analysis?.status === "processing"
    );
  }, [analysis?.status]);

  const { fetchCurrentUser } = useAuth();
  const rehydratingRef = useRef(false);

  /*
   * Stable callbacks — usePolling stores these in refs so the polling loop
   * never restarts when the parent re-renders.
   */
  const handlePollingSuccess = useCallback(
    async (updated) => {
      if (updated?.status === "completed") {
        if (rehydratingRef.current) return;
        rehydratingRef.current = true;

        try {
          // Rehydrate full document on completion
          const fullRes = await getAnalysis(id);
          if (fullRes?.success && fullRes?.data) {
            replaceAnalysis(fullRes.data);
          } else {
            mergeAnalysis(updated);
          }
          // Synchronize Navbar user credits immediately
          if (fetchCurrentUser) {
            void fetchCurrentUser();
          }
        } catch {
          mergeAnalysis(updated);
        }
      } else {
        mergeAnalysis(updated);
      }
    },
    [id, replaceAnalysis, mergeAnalysis, fetchCurrentUser],
  );

  const handlePollingError = useCallback(
    (err) => setError(err?.message || "Polling error."),
    [setError],
  );

  usePolling({
    enabled:   Boolean(id) && shouldPoll,
    analysisId: id,
    onSuccess:  handlePollingSuccess,
    onError:    handlePollingError,
  });

  /* -------------------------------------------------------------------------
  | Lazy Generation
  |-------------------------------------------------------------------------- */

  /*
   * Stable callbacks — useLazyGeneration stores these in refs so generate()
   * is never recreated due to callback identity changes.
   */
  const handleLazySuccess = useCallback(
    ({ content }) => mergeAnalysis(content),
    [mergeAnalysis],
  );

  const handleLazyError = useCallback(
    (err) => setError(err?.message || "Generation error."),
    [setError],
  );

  const { generate, generating, hasGenerated } = useLazyGeneration({
    analysisId: id,
    analysis,
    activeTab,
    onSuccess: handleLazySuccess,
    onError:   handleLazyError,
  });

  /* -------------------------------------------------------------------------
  | Generate on Tab Switch
  |-------------------------------------------------------------------------- */

  /*
   * IMPORTANT: analysis is intentionally NOT in the dependency array.
   *
   * generate() reads analysis internally via analysisRef (kept up-to-date
   * by a sync effect inside useLazyGeneration).  If analysis were listed
   * here, every mergeAnalysis() call would re-fire this effect, which would
   * call generate() again on an already-generated tab.  generate() would
   * no-op (via generatedTabsRef), but the extra invocation is wasteful and
   * can mask subtler bugs.
   *
   * This effect should fire ONLY when the user switches tabs.
   */
  useEffect(() => {
    if (!currentTab?.lazy) return;
    void generate(activeTab);
  }, [activeTab, currentTab?.lazy, generate]);

  /* -------------------------------------------------------------------------
  | Copy to clipboard
  |-------------------------------------------------------------------------- */

  const [copied, setCopied] = useState(null);
  const copyTimerRef        = useRef(null);

  const copy = useCallback(async (text, key) => {
    if (!text) return;

    try {
      if (!navigator.clipboard) {
        setError("Clipboard is not supported.");
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopied(key);

      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(null), 2_000);
    } catch {
      setError("Unable to copy to clipboard.");
    }
  }, [setError]);

  useEffect(() => {
    return () => clearTimeout(copyTimerRef.current);
  }, []);

  /* -------------------------------------------------------------------------
  | Screens
  |-------------------------------------------------------------------------- */

  if ((loading && !analysis) || analysis?.status === "queued" || analysis?.status === "processing") {
    return <LoadingScreen data={analysis} />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={loadAnalysis} />;
  }

  if (!analysis) {
    return <ErrorScreen error="Analysis not found." onRetry={loadAnalysis} />;
  }

  if (analysis.status === "failed") {
    return <FailedScreen analysis={analysis} router={router} />;
  }

  /* -------------------------------------------------------------------------
  | Render
  |-------------------------------------------------------------------------- */

  return (
    <ResultLayout>
      <ResultHeader analysis={analysis} />

      <ResultTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={changeTab}
      />

      <ResultContent
        activeTab={activeTab}
        analysis={analysis}
        loading={generating || (currentTab?.lazy && !hasGenerated(activeTab) && !analysisHasContent(analysis, activeTab))}
        copy={copy}
        copied={copied}
        buildPDF={buildPDF}
      />
    </ResultLayout>
  );
}
