import {
  FiActivity,
  FiBook,
  FiCheckCircle,
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
 * MVP Tabs
 * - Summary    (eager, always visible)
 * - Key Points (eager, always visible)
 * - Notes      (lazy, /notes endpoint)
 * - Roadmap    (lazy, /roadmap endpoint)
 * - Quiz       (lazy, /quiz endpoint)
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
    id: "roadmap",
    label: "Roadmap",
    icon: FiMap,

    alwaysVisible: true,
    lazy: true,

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
