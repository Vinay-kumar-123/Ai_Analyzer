"use client";

/**
 * ============================================================================
 * AI Learning OS
 * Flashcards Tab — v1
 * ----------------------------------------------------------------------------
 * Responsibilities:
 * • Show one flashcard at a time (no bulk rendering)
 * • CSS 3D flip animation (front = question, back = answer)
 * • Previous / Next navigation
 * • Progress indicator
 * • Shuffle mode
 * • Type badge + Difficulty badge
 * • Keyboard accessibility (Space → flip, ← → navigate)
 * • ARIA labels for screen readers
 *
 * State Architecture:
 * Uses useReducer intentionally. The action/state model is pre-wired for
 * future confidence ratings (Spaced Repetition) without redesigning the
 * component. See FUTURE comments throughout.
 *
 * NEVER in this file:
 * - API Calls
 * - Polling
 * - Business Logic
 * - Rendering all cards simultaneously
 * ============================================================================
 */

import { useReducer, useEffect, useMemo ,useCallback, useRef } from "react";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Loader2,
  Code2,
  Lightbulb,
  BookOpen,
  GitCompare,
  ToggleLeft,
  Map,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// CARD TYPE CONFIG
// ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  definition: {
    label: "Definition",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  concept: {
    label: "Concept",
    icon: Lightbulb,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  difference: {
    label: "Difference",
    icon: GitCompare,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  true_false: {
    label: "True / False",
    icon: ToggleLeft,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  code_recall: {
    label: "Code Recall",
    icon: Code2,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  scenario: {
    label: "Scenario",
    icon: Map,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
};

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  medium: { label: "Medium", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  hard:   { label: "Hard",   color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20" },
};

// ─────────────────────────────────────────────────────────────
// REDUCER
//
// useReducer is used intentionally. The state shape is designed
// so that future confidence rating (spaced repetition) can be
// added by:
//   1. Uncommenting the FUTURE fields in initialState()
//   2. Adding RATE_CARD and SET_STUDY_MODE cases to the reducer
//   3. Adding confidence buttons to the card back UI
// No structural changes to this file are required for that migration.
// ─────────────────────────────────────────────────────────────

function initialState(cards) {
  return {
    currentIndex: 0,
    isFlipped:    false,
    isShuffled:   false,
    cardOrder:    cards.map((_, i) => i),

    // ─── FUTURE: Confidence Ratings (Spaced Repetition) ──────────────
    // Uncomment when implementing spaced repetition.
    // Each field is pre-typed and documented for the future implementer.
    //
    // ratings: {},
    // ^ Map<cardIndex, "again" | "hard" | "good" | "easy">
    //
    // studyMode: "standard",
    // ^ "standard" | "spaced_repetition"
    //
    // sessionStats: { seen: 0, correct: 0, skipped: 0 },
    // ^ For learning analytics
    // ─────────────────────────────────────────────────────────────────
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "FLIP":
      return { ...state, isFlipped: !state.isFlipped };

    case "NEXT": {
      const next = (state.currentIndex + 1) % state.cardOrder.length;
      return { ...state, currentIndex: next, isFlipped: false };
    }

    case "PREV": {
      const prev = (state.currentIndex - 1 + state.cardOrder.length) % state.cardOrder.length;
      return { ...state, currentIndex: prev, isFlipped: false };
    }

    case "SHUFFLE": {
      const shuffled = [...state.cardOrder].sort(() => Math.random() - 0.5);
      return { ...state, isShuffled: true, cardOrder: shuffled, currentIndex: 0, isFlipped: false };
    }

    case "UNSHUFFLE":
      return {
        ...state,
        isShuffled: false,
        cardOrder: state.cardOrder.map((_, i) => i),
        currentIndex: 0,
        isFlipped: false,
      };

    case "RESET":
      return initialState(action.cards);

    // ─── FUTURE: Add these for confidence ratings ─────────────────────
    // case "RATE_CARD":
    //   return {
    //     ...state,
    //     ratings: { ...state.ratings, [action.cardIndex]: action.rating },
    //   };
    //
    // case "SET_STUDY_MODE":
    //   return { ...state, studyMode: action.mode };
    // ─────────────────────────────────────────────────────────────────

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FLASHCARD
// ─────────────────────────────────────────────────────────────

function Flashcard({ card, isFlipped, onFlip }) {
  const typeConfig = TYPE_CONFIG[card.type] || TYPE_CONFIG.concept;
  const diffConfig = DIFFICULTY_CONFIG[card.difficulty] || DIFFICULTY_CONFIG.easy;
  const TypeIcon = typeConfig.icon;

  return (
    <div
      className="w-full cursor-pointer focus:outline-none group"
      style={{ perspective: "1200px", minHeight: "280px" }}
      onClick={onFlip}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onFlip(); } }}
      tabIndex={0}
      role="button"
      aria-pressed={isFlipped}
      aria-label={isFlipped ? "Card showing answer. Press Space to flip back." : "Card showing question. Press Space to flip."}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "280px",
        }}
      >
        {/* ── Front (Question) ──────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-3xl border border-white/10 bg-[#0b0f19] p-6 md:p-8 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${typeConfig.bg} ${typeConfig.color}`}>
              <TypeIcon size={10} />
              {typeConfig.label}
            </span>
            <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${diffConfig.bg} ${diffConfig.color}`}>
              {diffConfig.label}
            </span>
            <span className="ml-auto text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Tap to reveal
            </span>
          </div>

          {/* Question */}
          <div className="flex-1 flex items-center justify-center text-center px-2">
            <p className="text-base md:text-lg font-bold text-white leading-relaxed">
              {card.question}
            </p>
          </div>

          {/* Tags */}
          {card.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5 justify-center">
              {card.tags.map((tag, i) => (
                <span key={i} className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Flip hint glow */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ boxShadow: "inset 0 0 40px rgba(59,130,246,0.04)" }}
          />
        </div>

        {/* ── Back (Answer) ─────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-[#0b0f19] p-6 md:p-8 flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Back header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${typeConfig.bg} ${typeConfig.color}`}>
              <TypeIcon size={10} />
              Answer
            </span>
            <span className="ml-auto text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Tap to flip back
            </span>
          </div>

          {/* Answer */}
          <div className="flex-1 flex items-center justify-center text-center px-2">
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
              {card.answer}
            </p>
          </div>

          {/* FUTURE: Confidence rating buttons will go here.
              When implementing spaced repetition, add 4 buttons below:
              [Again] [Hard] [Good] [Easy]
              Each dispatches { type: "RATE_CARD", cardIndex, rating }.
              Layout: flex row, full width, at the bottom of this face. */}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function FlashcardsTab({ analysis, loading }) {
  const flashcards = useMemo(
    () => (Array.isArray(analysis?.flashcards) ? analysis.flashcards : []),
    [analysis],
  );

  const [state, dispatch] = useReducer(reducer, flashcards, initialState);

  const containerRef = useRef(null);

  // ── Keyboard handler ──────────────────────────────────────
  const handleKey = useCallback(
    (e) => {
      if (flashcards.length === 0) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        dispatch({ type: "FLIP" });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        dispatch({ type: "NEXT" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        dispatch({ type: "PREV" });
      }
    },
    [flashcards.length],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Reset when new flashcards arrive
  useEffect(() => {
    if (flashcards.length > 0) {
      dispatch({ type: "RESET", cards: flashcards });
    }
  }, [flashcards]);

  if (!analysis) return null;

  // ── Loading state ─────────────────────────────────────────
  if (loading && flashcards.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-12 text-center space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
        <h2 className="text-lg font-black text-white">Generating Flashcards...</h2>
        <p className="text-xs text-slate-500">AI is creating study cards from your video content.</p>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────
  if (flashcards.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center space-y-4 text-slate-500">
        <Layers size={36} className="mx-auto opacity-30" />
        <h2 className="text-sm font-semibold">Flashcards Not Available</h2>
        <p className="text-xs">Click the Flashcards tab to generate study cards for this video.</p>
      </div>
    );
  }

  const total        = state.cardOrder.length;
  const currentPos   = state.currentIndex;
  const activeIndex  = state.cardOrder[currentPos];
  const activeCard   = flashcards[activeIndex];
  const isFirst      = currentPos === 0;
  const isLast       = currentPos === total - 1;

  if (!activeCard) return null;

  return (
    <section
      ref={containerRef}
      className="space-y-6 text-left"
      aria-label="Flashcards study mode"
    >
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers size={18} className="text-blue-400" />
            <span>Study Flashcards</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {total} cards · Space to flip · ← → to navigate
          </p>
        </div>

        {/* Shuffle toggle */}
        <button
          type="button"
          onClick={() => dispatch({ type: state.isShuffled ? "UNSHUFFLE" : "SHUFFLE" })}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
            state.isShuffled
              ? "bg-blue-600 border-blue-500 text-white"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
          aria-pressed={state.isShuffled}
          aria-label={state.isShuffled ? "Disable shuffle" : "Enable shuffle"}
        >
          <Shuffle size={14} />
          <span>{state.isShuffled ? "Shuffled" : "Shuffle"}</span>
        </button>
      </div>

      {/* ── PROGRESS ───────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span>Card {currentPos + 1} of {total}</span>
          <span>{Math.round(((currentPos + 1) / total) * 100)}%</span>
        </div>
        <ProgressBar current={currentPos} total={total} />
      </div>

      {/* ── CARD ───────────────────────────────────────────── */}
      <Flashcard
        card={activeCard}
        isFlipped={state.isFlipped}
        onFlip={() => dispatch({ type: "FLIP" })}
      />

      {/* ── NAVIGATION ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "PREV" })}
          disabled={total <= 1}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19]/30 px-5 py-3 text-xs font-bold text-slate-300 transition-all hover:bg-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous card"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Centre: flip hint */}
        <button
          type="button"
          onClick={() => dispatch({ type: "FLIP" })}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20"
          aria-label={state.isFlipped ? "Show question" : "Show answer"}
        >
          <RotateCcw size={14} />
          <span>{state.isFlipped ? "Question" : "Reveal Answer"}</span>
        </button>

        <button
          type="button"
          onClick={() => dispatch({ type: "NEXT" })}
          disabled={total <= 1}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19]/30 px-5 py-3 text-xs font-bold text-slate-300 transition-all hover:bg-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next card"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── KEYBOARD HINT ──────────────────────────────────── */}
      <div className="flex justify-center gap-4 pt-1">
        {[
          { key: "←", label: "Prev" },
          { key: "Space", label: "Flip" },
          { key: "→", label: "Next" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px] text-slate-500">
              {key}
            </kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
