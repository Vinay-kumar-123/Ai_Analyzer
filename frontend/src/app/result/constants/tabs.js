import {
  FiActivity,
  FiBook,
  FiCheckCircle,
  FiZap,
  FiMap,
  FiAward,
} from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Result Tabs Configuration
 * ----------------------------------------------------------------------------
 * Single source of truth for all Result Page tabs.
 *
 * Responsibilities
 * - Tab order
 * - Labels
 * - Icons
 * - Backend routes
 * - Cache keys
 * - Lazy generation configuration
 *
 * MVP Tabs (Q&A removed)
 * - Summary      (eager, no API)
 * - Key Points   (eager, no API)
 * - Notes        (lazy, /notes endpoint)
 * - Actions      (lazy, /roadmap endpoint — shared with Roadmap)
 * - Roadmap      (lazy, /roadmap endpoint — shared with Actions)
 * - Quiz         (lazy, /quiz endpoint)
 *
 * Endpoint sharing
 * - route:"roadmap" → Actions + Roadmap (one HTTP call, two tab results)
 * - route:"quiz"    → Quiz only
 *
 * NOTE
 * Never duplicate this configuration anywhere else.
 * ============================================================================
 */

export const RESULT_TABS = [
  {
    id: "summary",
    label: "Summary",
    icon: FiActivity,

    alwaysVisible: true,
    lazy: false,

    cacheKey: "summary",
    route: null,
  },

  {
    id: "keypoints",
    label: "Key Points",
    icon: FiCheckCircle,

    alwaysVisible: true,
    lazy: false,

    cacheKey: "keyPoints",
    route: null,
  },

  {
    id: "notes",
    label: "Notes",
    icon: FiBook,

    alwaysVisible: true,
    lazy: true,

    cacheKey: "notes",
    route: "notes",
  },

  {
    id: "actions",
    label: "Actions",
    icon: FiZap,

    alwaysVisible: true,
    lazy: true,

    /*
     * cacheKey matches the field returned by the /roadmap endpoint.
     * The endpoint returns: { roadmap: [...], actionSteps: [...] }
     */
    cacheKey: "actionSteps",
    route: "roadmap",
  },

  {
    id: "roadmap",
    label: "Roadmap",
    icon: FiMap,

    alwaysVisible: true,
    lazy: true,

    /*
     * Shares the same backend route as "actions".
     * One HTTP call satisfies both tabs.
     */
    cacheKey: "roadmap",
    route: "roadmap",
  },

  {
    id: "quiz",
    label: "Quiz",
    icon: FiAward,

    alwaysVisible: true,
    lazy: true,

    cacheKey: "quiz",
    route: "quiz",
  },
];

/**
 * Fast lookup map: tabId → tab config.
 */
export const RESULT_TAB_MAP = Object.freeze(
  RESULT_TABS.reduce((acc, tab) => {
    acc[tab.id] = tab;
    return acc;
  }, {})
);

/**
 * Ordered list of tab ids.
 */
export const RESULT_TAB_IDS = Object.freeze(
  RESULT_TABS.map((tab) => tab.id)
);

export default RESULT_TABS;