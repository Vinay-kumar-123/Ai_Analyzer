import {
  FiActivity,
  FiBook,
  FiCheckCircle,
  FiCode,
  FiHelpCircle,
  FiMap,
  FiFolder,
  FiCalendar,
  FiZap,
  FiAward,
  FiBookOpen,
} from "react-icons/fi";

export const TAB_CONFIG = [
  { id: "summary", label: "Summary", icon: FiActivity, always: true },
  { id: "notes", label: "Notes", icon: FiBook, key: "notes", lazy: true, lazyRoute: "notes" },
  { id: "keypoints", label: "Key Points", icon: FiCheckCircle, always: true },
  { id: "actions", label: "Actions", icon: FiZap, key: "actionSteps", lazy: true, lazyRoute: "roadmap" },
  { id: "roadmap", label: "Roadmap", icon: FiMap, key: "roadmap", lazy: true, lazyRoute: "roadmap" },
  { id: "qa", label: "Q & A", icon: FiHelpCircle, key: "qa", lazy: true, lazyRoute: "quiz" },
  { id: "quiz", label: "Quiz", icon: FiAward, key: "quiz", lazy: true, lazyRoute: "quiz" },
  // Removed non-MVP tabs: flashcards, engine, project, plan
];
