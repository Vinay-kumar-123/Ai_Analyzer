import { useCallback, useEffect, useRef } from "react";
import { getAnalysis } from "../services/resultApi.js";

/**
 * ============================================================================
 * AI Learning OS
 * Result Polling Hook
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Poll analysis status until completed or failed
 * • Abort previous request on overlap
 * • One polling loop only — idempotent across StrictMode double-mount
 * • React StrictMode safe
 * • Pause when browser tab is hidden
 * • Resume when tab becomes visible
 * • Stop automatically after completion / failure
 *
 * STABILITY DESIGN
 * ----------------
 * onSuccess and onError are stored in refs so they are NOT dependency-array
 * members.  This means the polling loop effect only runs once (when enabled
 * or analysisId change), not every render.  Without this pattern, any state
 * update that recreates the callbacks (e.g. mergeAnalysis) would tear down
 * and restart the polling loop, creating duplicate concurrent loops.
 *
 * ============================================================================
 */

const DEFAULT_INTERVAL = 2_500;
const MAX_INTERVAL     = 10_000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {object}   options
 * @param {string}   options.analysisId  - MongoDB ObjectId to poll.
 * @param {boolean}  [options.enabled]   - Whether polling is active.
 * @param {Function} options.onSuccess   - Called with the latest analysis object.
 * @param {Function} [options.onError]   - Called with an Error on failure.
 */
export function usePolling({
  analysisId,
  enabled = true,
  onSuccess,
  onError,
}) {
  /* -------------------------------------------------------------------------
     Stable callback refs
     Storing callbacks in refs means the polling loop effect does NOT need
     them in its dependency array.  The latest version is always called.
     ---------------------------------------------------------------------- */

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef   = useRef(onError);

  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current   = onError;   }, [onError]);

  /* -------------------------------------------------------------------------
     Loop control refs
     ---------------------------------------------------------------------- */

  const controllerRef  = useRef(null);
  const runningRef     = useRef(false);
  const stoppedRef     = useRef(false);
  const intervalRef    = useRef(DEFAULT_INTERVAL);

  /* -------------------------------------------------------------------------
     stop() — public + internal
     ---------------------------------------------------------------------- */

  const stop = useCallback(() => {
    stoppedRef.current = true;
    runningRef.current = false;

    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  /* -------------------------------------------------------------------------
     poll() — one fetch cycle
     Uses refs for callbacks so it never needs to be recreated.
     ---------------------------------------------------------------------- */

  const poll = useCallback(async () => {
    if (!enabled)              return;
    if (!analysisId)           return;
    if (stoppedRef.current)    return;
    if (runningRef.current)    return;
    if (document.hidden)       return;

    runningRef.current = true;

    // Abort any previous in-flight request
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    try {
      const result = await getAnalysis(analysisId, controllerRef.current.signal);

      if (result.status === 429) {
        intervalRef.current = Math.min(intervalRef.current * 2, MAX_INTERVAL);
        return;
      }

      if (!result.ok) {
        throw new Error(result.data?.message || `HTTP ${result.status}`);
      }

      intervalRef.current = DEFAULT_INTERVAL;

      const analysis = result.data?.data ?? result.data;

      if (!analysis) {
        throw new Error("Analysis missing in response.");
      }

      onSuccessRef.current?.(analysis);

      if (analysis.status === "completed" || analysis.status === "failed") {
        stop();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        onErrorRef.current?.(error);
        intervalRef.current = Math.min(intervalRef.current + 1_000, MAX_INTERVAL);
      }
    } finally {
      runningRef.current = false;
    }
  }, [
    // Only truly stable values here — callbacks are NOT included
    analysisId,
    enabled,
    stop,
  ]);

  /* -------------------------------------------------------------------------
     Main polling effect
     Deps: [enabled, poll, stop]
     poll is stable because it only depends on [analysisId, enabled, stop].
     This effect runs only when enabled/analysisId changes — not on every
     render that recreates onSuccess/onError.
     ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    stoppedRef.current = false;

    let mounted = true;

    const loop = async () => {
      while (mounted && !stoppedRef.current) {
        if (!document.hidden) {
          await poll();
        }

        if (stoppedRef.current) break;

        await wait(intervalRef.current);
      }
    };

    loop();

    const handleVisibility = () => {
      if (!document.hidden && !stoppedRef.current) {
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      stop();
    };
  }, [
    enabled,
    poll,
    stop,
  ]);

  return { stop };
}

export default usePolling;