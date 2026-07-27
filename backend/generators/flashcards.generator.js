/**
 * ============================================================================
 * AI Learning OS
 * Flashcards Generator — v1
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate high-quality study flashcards reusing existing Notes output
 * whenever possible, falling back to the raw transcript.
 *
 * Input:  { transcript, goal, language, sections?, useSections? }
 * Output: { flashcards: [...] }
 *
 * ────────────────────────────────────────────────────────────────────────────
 * INPUT STRATEGY ARCHITECTURE
 * ────────────────────────────────────────────────────────────────────────────
 *
 * buildFlashcardInput() is the single extensibility hook for choosing what
 * content the AI receives. It currently supports two strategies:
 *
 *   "sections"   — serialize stored Notes sections from MongoDB
 *                  (preferred — ~90% fewer tokens than raw transcript)
 *   "transcript" — truncated raw transcript (fallback)
 *
 * FUTURE MIGRATION PATH (Knowledge Object)
 * -----------------------------------------
 * When a shared "Knowledge Object" is introduced, add a third branch here:
 *
 *   if (knowledgeObject && knowledgeObject.topics?.length) {
 *     return buildKnowledgeObjectInput(knowledgeObject);
 *   }
 *
 * The public generator API signature never needs to change for this migration:
 *   generateFlashcards({ transcript, goal, language, sections, useSections })
 *
 * Only buildFlashcardInput() needs to be extended.
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import { generate } from "./shared/generator.base.js";
import { TOKEN_LIMITS } from "./shared/openai.client.js";
import { getFlashcardsPrompt } from "../prompts/flashcards.prompt.js";
import {
  getConcepts,
  getDefinitions,
  getComparisons,
  getCommands,
  getInterviewInsights,
  getBestPractices,
  getCommonMistakes,
  getTopics,
} from "../services/knowledge/knowledgeCore.reader.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_TRANSCRIPT_CHARS = 100_000;

const EMPTY_RESULT = Object.freeze({ flashcards: [] });

// ─── Input Strategy ──────────────────────────────────────────────────────────

/**
 * Choose and build the AI input based on the available data strategy.
 *
 * Priority Order:
 * 1. Knowledge Core (via access layer helpers) — cleanest, graph-ready primitives
 * 2. Sections — stored Notes sections (fallback)
 * 3. Transcript — raw text (final fallback)
 *
 * @param {Object}   opts
 * @param {string}   opts.transcript    - Raw video transcript
 * @param {Array}    opts.sections      - Stored Notes sections from MongoDB
 * @param {boolean}  opts.useSections   - True when Notes have been generated
 * @param {Object}   opts.knowledgeCore - Knowledge Core object (or in-memory fallback)
 * @param {Object}   opts.masterNotes   - Master Notes V3 object
 * @returns {string}  Serialized input for the AI
 */
function buildFlashcardInput({ masterNotes, transcript, sections, useSections, knowledgeCore }) {
  // ── Strategy 0: Master Notes V3 (highest priority) ────────────────────
  if (masterNotes) {
    return JSON.stringify({ _strategy: "masterNotes", ...masterNotes });
  }

  // ── Strategy 1: Knowledge Core (preferred) ─────────────────────────────
  // Uses the stable access layer helpers to retrieve normalized primitives.
  if (knowledgeCore) {
    const concepts     = getConcepts(knowledgeCore);
    const definitions  = getDefinitions(knowledgeCore);
    const comparisons  = getComparisons(knowledgeCore);
    const commands     = getCommands(knowledgeCore);
    const insights     = getInterviewInsights(knowledgeCore);
    const bestPrac     = getBestPractices(knowledgeCore);
    const mistakes     = getCommonMistakes(knowledgeCore);
    const topics       = getTopics(knowledgeCore);

    if (concepts.length > 0 || definitions.length > 0 || topics.length > 0) {
      const payload = {
        _strategy: "knowledgeCore",
        topics,
        concepts,
        definitions,
        comparisons,
        commands,
        interviewInsights: insights,
        bestPractices: bestPrac,
        commonMistakes: mistakes,
      };

      return JSON.stringify(payload);
    }
  }

  // ── Strategy 2: sections (fallback) ─────────────────────────────────────
  // When Notes have already been generated, use the structured sections.
  if (useSections && Array.isArray(sections) && sections.length > 0) {
    const payload = {
      _strategy: "sections",
      topics: sections.map((s) => ({
        title:      s.title      || "Untitled",
        content:    s.content    || "",
        type:       s.type       || "core_concept",
        difficulty: s.difficulty || "beginner",
      })),
    };

    return JSON.stringify(payload);
  }

  // ── Strategy 3: transcript (fallback) ────────────────────────────────────
  return typeof transcript === "string"
    ? transcript.slice(0, MAX_TRANSCRIPT_CHARS)
    : "";
}

// ─── Generator ───────────────────────────────────────────────────────────────

/**
 * Generate study flashcards using Knowledge Core, stored Notes sections, or raw transcript.
 *
 * @param {Object}  opts
 * @param {Object}  [opts.masterNotes]  - Master Notes V3 object
 * @param {string}  opts.transcript     - Raw transcript (fallback input)
 * @param {string}  [opts.goal]         - User's study goal
 * @param {string}  [opts.language]     - Output language
 * @param {Array}   [opts.sections]     - Stored Notes sections
 * @param {boolean} [opts.useSections]  - Whether sections are available and valid
 * @param {Object}  [opts.knowledgeCore]- Knowledge Core instance
 *
 * @returns {Promise<{ flashcards: Array }>}
 */
export async function generateFlashcards({
  transcript,
  goal          = "student",
  language      = "english",
  sections      = [],
  useSections   = false,
  knowledgeCore = null,
}) {
  const input = buildFlashcardInput({ transcript, sections, useSections, knowledgeCore });

  if (!input || !input.trim()) {
    return EMPTY_RESULT;
  }

  const prompt = getFlashcardsPrompt({ goal, language });

  const data = await generate({
    prompt,
    transcript: input,
    model:      "SMART",
    maxTokens:  TOKEN_LIMITS.FLASHCARDS || TOKEN_LIMITS.QUIZ,
  });

  const cards = Array.isArray(data?.flashcards) ? data.flashcards : [];

  if (!cards.length) {
    return EMPTY_RESULT;
  }

  return { flashcards: cards };
}

export default generateFlashcards;
