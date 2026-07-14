"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RESULT_TABS from "../constants/tabs.js";

/**
 * ============================================================================
 * AI Learning OS
 * Tab Manager Hook
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * - Active tab state
 * - Visible tabs
 * - Tab validation
 * - Safe tab switching
 *
 * This hook NEVER:
 * - Calls APIs
 * - Generates content
 * - Handles polling
 * ============================================================================
 */

export function useTabManager(analysis) {
  /*
   * --------------------------------------------------------------------------
   * Active Tab
   * --------------------------------------------------------------------------
   */

  const [activeTab, setActiveTab] = useState("summary");

  /*
   * --------------------------------------------------------------------------
   * Check if tab has content
   * --------------------------------------------------------------------------
   */

  const hasContent = useCallback((tab) => {
    if (!analysis) return false;

    if (tab.alwaysVisible) {
      return true;
    }

    if (!tab.cacheKey) {
      return false;
    }

    const value = analysis[tab.cacheKey];

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  }, [analysis]);

  /*
   * --------------------------------------------------------------------------
   * Visible Tabs
   * --------------------------------------------------------------------------
   */

  const visibleTabs = useMemo(() => {
    return RESULT_TABS.filter((tab) => {
      if (tab.alwaysVisible) {
        return true;
      }

      /*
       * Lazy tabs are always shown.
       * Content will be generated after click.
       */
      if (tab.lazy) {
        return true;
      }

      return hasContent(tab);
    });
  }, [hasContent]);

  /*
   * --------------------------------------------------------------------------
   * Keep active tab valid
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!visibleTabs.length) return;

    const exists = visibleTabs.some(
      (tab) => tab.id === activeTab,
    );

    if (!exists) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  /*
   * --------------------------------------------------------------------------
   * Safe tab change
   * --------------------------------------------------------------------------
   */

  const changeTab = useCallback((tabId) => {
    const exists = RESULT_TABS.some(
      (tab) => tab.id === tabId,
    );

    if (!exists) {
      return;
    }

    setActiveTab(tabId);
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Current Tab
   * --------------------------------------------------------------------------
   */

  const currentTab = useMemo(() => {
    return (
      RESULT_TABS.find(
        (tab) => tab.id === activeTab,
      ) || RESULT_TABS[0]
    );
  }, [activeTab]);

  /*
   * --------------------------------------------------------------------------
   * Export
   * --------------------------------------------------------------------------
   */

  return {
    activeTab,

    currentTab,

    visibleTabs,

    changeTab,

    hasContent,
  };
}

export default useTabManager;