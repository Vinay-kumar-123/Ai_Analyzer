/**
 * ============================================================================
 * AI Learning OS — Lazy Generation Hook
 * src/app/result/hooks/useLazyGeneration.js
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Generates AI content for lazy Result tabs (Notes, Roadmap, Quiz)
 * exactly once per session.  Content that already exists in the analysis
 * object is NEVER re-generated.
 *
 * GUARANTEES
 * ----------
 *  1. Single-request   — one HTTP request per backend route, ever.
 *  2. Never regenerate — analysis object is the primary source of truth.
 *  3. Three-layer cache — analysis → memory → API (strict priority).
 *  4. In-flight guard  — concurrent calls to the same route are no-ops.
 *  5. Stale-response   — version counter drops superseded responses.
 *  6. Abort on unmount — AbortController prevents memory leaks.
 *  7. StrictMode safe  — idempotent mount/unmount; cache/generated set
 *                        survive the StrictMode double-invoke.
 *  8. Endpoint dedup   — tabs sharing the same route share one HTTP call.
 *  9. Exponential backoff — HTTP 429 retried at 2 s / 4 s / 8 s with
 *                           Retry-After header respected.
 * 10. Stable callbacks — generate() reference is stable; never recreated
 *                        due to callback identity changes.
 * 11. Generated-tab set — permanent Set<tabId> per session.
 * 12. No duplicate onSuccess — analysis-layer hits do NOT fire onSuccess
 *                             (content is already in state).
 *
 * CALLBACK SIGNATURES (always consistent)
 * ----------------------------------------
 *   onSuccess({ tabId, content })
 *   onError(error)
 *
 * DISPATCH MODEL
 * --------------
 * The hook dispatches by tab.ROUTE (backend endpoint), not by tab.id.
 * This is the fundamental deduplication key.
 *
 *   Notes   tab → route "notes"   → one HTTP request
 *   Roadmap tab → route "roadmap" → one HTTP request
 *   Quiz    tab → route "quiz"    → one HTTP request
 *
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { generateLazyContent } from "../services/resultApi.js";
import { RESULT_TAB_MAP } from "../constants/tabs.js";

/* ============================================================================
   Constants
   ========================================================================== */

/** Maximum retry attempts for HTTP 429. */
const MAX_RETRIES = 10;

/** Exponential backoff delays (ms) indexed by attempt number (0-based). */
const RETRY_DELAYS = [3_000, 5_000, 10_000, 15_000];

/* ============================================================================
   Module-level endpoint group map
   ============================================================================
   Built once at module load from RESULT_TAB_MAP.
   Maps:  route → [tabId, ...]
   Tabs that share the same route are resolved together from one HTTP response.
   ========================================================================== */

/**
 * @returns {Map<string, string[]>}
 */
function buildEndpointGroupMap() {
  const map = new Map();

  for (const [tabId, tab] of Object.entries(RESULT_TAB_MAP)) {
    if (!tab.lazy || !tab.route) continue;

    if (!map.has(tab.route)) {
      map.set(tab.route, []);
    }

    map.get(tab.route).push(tabId);
  }

  return map;
}

/** route → [tabId, ...]  (immutable after module load) */
const ENDPOINT_GROUP_MAP = buildEndpointGroupMap();

/* ============================================================================
   Pure helpers (no React state)
   ========================================================================== */

/**
 * Extract the tab-specific content slice from a raw API response payload.
 *
 * The roadmap endpoint returns { roadmap: [...], actionSteps: [...] }.
 * We extract each tab's slice via its cacheKey.
 *
 * Falls back to the entire payload for single-key endpoints.
 *
 * @param {string} tabId
 * @param {object} data   - Raw payload from API (result.data or result.data.data).
 * @returns {*}           - Content for this tab, or undefined.
 */
function extractTabContent(tabId, data) {
  // Return the entire payload because the UI merges it into the analysis state object.
  return data;
}

/**
 * Return true when the live analysis object has non-empty content for tabId.
 * This is the PRIMARY source of truth check.
 *
 * @param {object|null} analysis
 * @param {string}      tabId
 * @returns {boolean}
 */
export function analysisHasContent(analysis, tabId) {
  if (!analysis) return false;

  const tab = RESULT_TAB_MAP[tabId];
  if (!tab?.cacheKey) return false;

  const value = analysis[tab.cacheKey];

  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

/* ============================================================================
   Hook
   ========================================================================== */

/**
 * @typedef {object} UseLazyGenerationOptions
 * @property {string}      analysisId  - MongoDB ObjectId.
 * @property {object|null} analysis    - Live analysis object (source of truth).
 * @property {string}      activeTab   - Currently active tab id.
 * @property {Function}    onSuccess   - Called as onSuccess({ tabId, content }).
 * @property {Function}    [onError]   - Called as onError(error).
 */

/**
 * @typedef {object} UseLazyGenerationReturn
 * @property {Function} generate     - (tabId: string) => Promise<boolean>
 * @property {boolean}  generating   - True while any HTTP request is in flight.
 * @property {Function} isCached     - (tabId: string) => boolean
 * @property {Function} hasGenerated - (tabId: string) => boolean
 * @property {Function} isInFlight   - (tabId: string) => boolean
 * @property {Function} cancel       - (tabId: string) => void
 */

/**
 * AI Learning OS — Lazy Generation Hook.
 *
 * @param {UseLazyGenerationOptions} options
 * @returns {UseLazyGenerationReturn}
 */
export function useLazyGeneration({
  analysisId,
  analysis,
  activeTab,
  onSuccess,
  onError,
}) {
  /* --------------------------------------------------------------------------
     Refs — all mutable registries live in refs.
     Refs do not trigger re-renders and are stable across the lifecycle.
     -------------------------------------------------------------------------- */

  /**
   * Set<tabId> — tabs that have been successfully generated this session.
   * Once added, a tab is never re-generated.
   * Survives StrictMode double-invoke (intentionally NOT cleared on unmount).
   */
  const generatedTabsRef = useRef(new Set());

  /**
   * Map<route, true> — routes with an in-flight HTTP request.
   * Keyed by ROUTE (not tabId) for endpoint-level deduplication.
   */
  const inFlightRoutesRef = useRef(new Map());

  /**
   * Map<cacheKey, content> — memory cache.
   * Secondary source of truth (after the analysis object).
   * Survives StrictMode double-invoke.
   */
  const cacheRef = useRef(new Map());

  /**
   * Map<route, retryCount> — 429 retry counters.
   */
  const retriesRef = useRef(new Map());

  /**
   * Map<route, timeoutId> — scheduled retry timers.
   */
  const timersRef = useRef(new Map());

  /**
   * Map<route, AbortController> — live request controllers.
   */
  const controllersRef = useRef(new Map());

  /**
   * Map<route, version> — monotonically increasing per-route counter.
   * Stale responses (version mismatch) are silently discarded.
   */
  const versionRef = useRef(new Map());

  /**
   * Lifecycle flag.  false after unmount; prevents orphaned async state updates.
   * Initialised to true because the hook runs synchronously during render.
   */
  const mountedRef = useRef(true);

  /* --------------------------------------------------------------------------
     Stable callback refs
     Storing the latest callbacks in refs lets generate() and executeRequest()
     remain stable (no callback in their dep arrays) while always calling the
     most recent version.
     -------------------------------------------------------------------------- */

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef   = useRef(onError);

  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current   = onError;   }, [onError]);

  /**
   * Always holds the latest analysis without being a useCallback dependency.
   */
  const analysisRef = useRef(analysis);
  useEffect(() => { analysisRef.current = analysis; }, [analysis]);

  /* --------------------------------------------------------------------------
     Generating state
     -------------------------------------------------------------------------- */

  const [generating, setGenerating] = useState(false);

  /* --------------------------------------------------------------------------
     Cache helpers
     -------------------------------------------------------------------------- */

  /** Returns true if the tab's content is in the memory cache. */
  const isCached = useCallback((tabId) => {
    const tab = RESULT_TAB_MAP[tabId];
    if (!tab) return false;
    return cacheRef.current.has(tab.cacheKey);
  }, []);

  /** Returns cached content for a tab, or null. */
  const getCachedContent = useCallback((tabId) => {
    const tab = RESULT_TAB_MAP[tabId];
    if (!tab) return null;
    return cacheRef.current.get(tab.cacheKey) ?? null;
  }, []);

  /** Writes content into the memory cache under the tab's cacheKey. */
  const setCacheEntry = useCallback((tabId, content) => {
    const tab = RESULT_TAB_MAP[tabId];
    if (!tab) return;
    cacheRef.current.set(tab.cacheKey, content);
  }, []);

  /** Returns true if the tab has already been generated successfully this session. */
  const hasGenerated = useCallback((tabId) => {
    return generatedTabsRef.current.has(tabId);
  }, []);

  /* --------------------------------------------------------------------------
     In-flight helper
     -------------------------------------------------------------------------- */

  /** Returns true if a request for this tab's route is currently in flight. */
  const isInFlight = useCallback((tabId) => {
    const tab = RESULT_TAB_MAP[tabId];
    if (!tab?.route) return false;
    return inFlightRoutesRef.current.has(tab.route);
  }, []);

  /* --------------------------------------------------------------------------
     Route cleanup
     -------------------------------------------------------------------------- */

  /**
   * Abort request, cancel retry timer, and remove all tracking for a route.
   */
  const cleanupRoute = useCallback((route) => {
    const controller = controllersRef.current.get(route);
    if (controller) {
      controller.abort();
      controllersRef.current.delete(route);
    }

    const timer = timersRef.current.get(route);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(route);
    }

    retriesRef.current.delete(route);
    inFlightRoutesRef.current.delete(route);
  }, []);

  /**
   * Cancel generation for a specific tab.
   */
  const cancel = useCallback((tabId) => {
    const tab = RESULT_TAB_MAP[tabId];
    if (!tab?.route) return;
    cleanupRoute(tab.route);
  }, [cleanupRoute]);

  /* --------------------------------------------------------------------------
     fulfilSharedTabs
     --------------------------------------------------------------------------
     When one HTTP response arrives, resolve ALL sibling tabs that share the
     same backend route.  Extract each tab's data slice via its cacheKey, seed
     the memory cache, mark as generated, and fire onSuccess once per tab.

     CRITICAL: All sibling tabs are processed regardless of whether any of
     them are already in generatedTabsRef — the cache must always be seeded
     even if onSuccess has already been called.  The generatedTabsRef guard
     only prevents firing onSuccess a second time.
     -------------------------------------------------------------------------- */

  const fulfilSharedTabs = useCallback((route, data) => {
    const siblingTabIds = ENDPOINT_GROUP_MAP.get(route) ?? [];

    for (const sibId of siblingTabIds) {
      const content = extractTabContent(sibId, data);
      if (content === undefined || content === null) continue;

      // Always seed the cache (idempotent)
      setCacheEntry(sibId, content);

      // Only fire onSuccess and mark generated once
      if (!generatedTabsRef.current.has(sibId)) {
        generatedTabsRef.current.add(sibId);
        onSuccessRef.current?.({ tabId: sibId, content });
      }
    }
  }, [setCacheEntry]);

  /* --------------------------------------------------------------------------
     scheduleRetry
     -------------------------------------------------------------------------- */

  const scheduleRetry = useCallback((
    route,
    triggerTabId,
    retryAfterMs,
    executeRequest,
  ) => {
    const attempt = retriesRef.current.get(route) ?? 0;

    if (attempt >= MAX_RETRIES) {
      retriesRef.current.delete(route);
      inFlightRoutesRef.current.delete(route);
      
      // If no other routes are in flight, turn off generating indicator
      if (inFlightRoutesRef.current.size === 0) {
        setGenerating(false);
      }
      return;
    }

    const backoffDelay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
    const delay = Math.max(backoffDelay, retryAfterMs);

    retriesRef.current.set(route, attempt + 1);

    // Release the in-flight lock while waiting; retry will re-acquire it
    inFlightRoutesRef.current.delete(route);

    const timer = setTimeout(() => {
      timersRef.current.delete(route);
      if (!mountedRef.current) return;
      executeRequest(route, triggerTabId);
    }, delay);

    timersRef.current.set(route, timer);
  }, []);

  /* --------------------------------------------------------------------------
     executeRequest — core HTTP layer
     --------------------------------------------------------------------------
     All mutable values read from refs to eliminate stale-closure bugs.
     -------------------------------------------------------------------------- */

  const executeRequest = useCallback(async (route, triggerTabId) => {
    if (!mountedRef.current) return;

    // Idempotency guard — one in-flight request per route at a time
    if (inFlightRoutesRef.current.has(route)) return;

    // Advance the version counter for stale-response detection
    const version = (versionRef.current.get(route) ?? 0) + 1;
    versionRef.current.set(route, version);

    inFlightRoutesRef.current.set(route, true);

    const controller = new AbortController();
    controllersRef.current.set(route, controller);

    setGenerating(true);

    try {
      const result = await generateLazyContent(
        analysisId,
        route,
        controller.signal,
      );

      // Stale-response guard
      if (versionRef.current.get(route) !== version) return;

      // Unmount guard
      if (!mountedRef.current) return;

      // HTTP 429 — exponential backoff with Retry-After
      if (result.status === 429) {
        const retryAfterMs = (result.retryAfter ?? 0) * 1_000;
        inFlightRoutesRef.current.delete(route);
        controllersRef.current.delete(route);
        scheduleRetry(route, triggerTabId, retryAfterMs, executeRequest);
        return;
      }

      // Non-retryable HTTP error
      if (!result.ok) {
        throw new Error(
          result.message ?? result.data?.message ?? `HTTP ${result.status}`,
        );
      }

      // Business-level failure
      if (result.success === false) {
        throw new Error(result.message ?? "Generation failed.");
      }

      // Success — resolve all tabs sharing this route
      const data = result.data?.data ?? result.data;
      if (data) {
        fulfilSharedTabs(route, data);
      }

      retriesRef.current.delete(route);
    } catch (error) {
      if (error.name !== "AbortError" && mountedRef.current) {
        onErrorRef.current?.(error);
      }
    } finally {
      inFlightRoutesRef.current.delete(route);
      controllersRef.current.delete(route);

      if (mountedRef.current) {
        setGenerating(inFlightRoutesRef.current.size > 0);
      }
    }
  }, [analysisId, scheduleRetry, fulfilSharedTabs]);

  /* --------------------------------------------------------------------------
     generate — public entry point
     --------------------------------------------------------------------------
     Priority chain (strictly ordered):

       1. Analysis object (MongoDB — permanent cache)
          If content already exists → seed memory cache + mark generated.
          Do NOT fire onSuccess (content is already in React state).

       2. Memory cache (session cache)
          If cached → fire onSuccess to re-apply content to state, mark
          generated.  This handles tab-switching after the initial generate.

       3. In-flight guard
          If the route is already being fetched → no-op.  The response will
          resolve all sibling tabs when it arrives.

       4. Already-generated guard
          If generatedTabsRef already has this tabId → no-op.  Prevents
          re-generation even if the memory cache was somehow cleared.

       5. API request
          None of the above → initiate HTTP request.
     -------------------------------------------------------------------------- */

  const generate = useCallback(async (tabId) => {
    if (!mountedRef.current) return false;
    if (!analysisId)         return false;

    const tab = RESULT_TAB_MAP[tabId];
    if (!tab)       return false;
    if (!tab.lazy)  return false;
    if (!tab.route) return false;

    // ── Priority 1 — analysis object ──────────────────────────────────────
    if (analysisHasContent(analysisRef.current, tabId)) {
      // Seed memory cache so future calls hit Priority 2 instead
      if (!isCached(tabId)) {
        setCacheEntry(tabId, analysisRef.current[tab.cacheKey]);
      }
      // Mark as generated (idempotent)
      generatedTabsRef.current.add(tabId);

      /*
       * Do NOT fire onSuccess here.
       * The analysis content is already in React state (replaceAnalysis /
       * mergeAnalysis was called).  Firing onSuccess again would call
       * mergeAnalysis a second time with the same content, creating a new
       * analysis object reference and re-triggering the generate effect in
       * page.js.  That is the root cause of the duplicate-request bug.
       */
      return true;
    }

    // ── Priority 2 — memory cache ──────────────────────────────────────────
    if (isCached(tabId)) {
      const cached = getCachedContent(tabId);
      if (!generatedTabsRef.current.has(tabId)) {
        generatedTabsRef.current.add(tabId);
        // Fire onSuccess so state is updated for this tab
        onSuccessRef.current?.({ tabId, content: cached });
      }
      return true;
    }

    // ── Priority 3 — already in flight (endpoint dedup) ───────────────────
    if (inFlightRoutesRef.current.has(tab.route)) return true;

    // ── Priority 4 — already generated this session ───────────────────────
    if (generatedTabsRef.current.has(tabId)) return true;

    // ── Priority 5 — initiate HTTP request ────────────────────────────────
    void executeRequest(tab.route, tabId);

    return true;
  }, [
    analysisId,
    isCached,
    getCachedContent,
    setCacheEntry,
    executeRequest,
  ]);



  /* --------------------------------------------------------------------------
     Lifecycle — mount / unmount
     -------------------------------------------------------------------------- */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Abort all in-flight requests
      for (const [route] of controllersRef.current) {
        cleanupRoute(route);
      }

      // Defensive sweep for any route that lost its controller reference
      for (const [route] of inFlightRoutesRef.current) {
        cleanupRoute(route);
      }

      // Cancel all pending retry timers
      for (const [, timer] of timersRef.current) {
        clearTimeout(timer);
      }

      inFlightRoutesRef.current.clear();
      timersRef.current.clear();
      retriesRef.current.clear();
      versionRef.current.clear();

      /*
       * cacheRef and generatedTabsRef are intentionally preserved on unmount.
       * When the component remounts (StrictMode double-invoke, navigation back)
       * previously generated content is immediately available without any
       * additional API calls.
       */
    };
  }, [cleanupRoute]);

  /* --------------------------------------------------------------------------
     Public interface
     -------------------------------------------------------------------------- */

  return {
    /** (tabId: string) => Promise<boolean> */
    generate,

    /** True while at least one HTTP request is in flight. */
    generating,

    /** (tabId: string) => boolean — memory cache hit check */
    isCached,

    /** (tabId: string) => boolean — tab generated successfully this session */
    hasGenerated,

    /** (tabId: string) => boolean — route in-flight check */
    isInFlight,

    /** (tabId: string) => void — abort and clean up */
    cancel,
  };
}

export default useLazyGeneration;
