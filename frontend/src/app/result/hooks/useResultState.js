"use client";

import { useCallback, useState } from "react";

/**
 * ============================================================================
 * AI Learning OS
 * Result State Hook
 * ----------------------------------------------------------------------------
 * Centralized state manager for the Result module.
 *
 * Responsibilities
 * - Analysis state
 * - Loading state
 * - Error state
 * - Immutable updates
 * - Merge lazy generated content
 *
 * This hook NEVER:
 * - Calls APIs
 * - Generates content
 * - Handles polling
 * ============================================================================
 */

export function useResultState() {
  /*
   * --------------------------------------------------------------------------
   * State
   * --------------------------------------------------------------------------
   */

  const [analysis, setAnalysis] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /*
   * --------------------------------------------------------------------------
   * Replace entire analysis
   * --------------------------------------------------------------------------
   */

  const replaceAnalysis = useCallback((nextAnalysis) => {
    setAnalysis(nextAnalysis ?? null);
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Merge analysis
   * --------------------------------------------------------------------------
   */

  const mergeAnalysis = useCallback((partial) => {
    if (!partial) return;

    setAnalysis((previous) => {
      if (!previous) {
        return partial;
      }

      return {
        ...previous,
        ...partial,
      };
    });
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Update one field
   * --------------------------------------------------------------------------
   */

  const updateField = useCallback((key, value) => {
    setAnalysis((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        [key]: value,
      };
    });
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Clear
   * --------------------------------------------------------------------------
   */

  const reset = useCallback(() => {
    setAnalysis(null);
    setLoading(false);
    setError("");
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Error helpers
   * --------------------------------------------------------------------------
   */

  const clearError = useCallback(() => {
    setError("");
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Export
   * --------------------------------------------------------------------------
   */

  return {
    analysis,

    loading,
    error,

    setLoading,
    setError,

    replaceAnalysis,

    mergeAnalysis,

    updateField,

    clearError,

    reset,
  };
}

export default useResultState;