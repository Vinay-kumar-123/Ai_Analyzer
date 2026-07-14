import { TOKEN_LIMITS } from "./shared/openai.client.js";
import { generate } from "./shared/generator.base.js";
import { getSynthesisPrompt } from "../prompts/synthesis.prompt.js";

/**
 * ============================================================================
 * AI Learning OS
 * Synthesis Generator
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Convert merged learning memory into premium educational notes.
 *
 * Input:
 * Memory object produced by memory.builder.js
 *
 * Output:
 * - notes
 * - sections
 *
 * This generator NEVER performs:
 * - transcript chunking
 * - transcript fetching
 * - chunk analysis
 * - quiz generation
 * - flashcard generation
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({
  notes: "",
  sections: [],
});

function safeString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function safeSections(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(Boolean)
    .map((section, index) => ({
      title:
        typeof section.title === "string"
          ? section.title.trim()
          : `Section ${index + 1}`,

      content:
        typeof section.content === "string"
          ? section.content.trim()
          : "",

      type:
        typeof section.type === "string"
          ? section.type
          : "core_concept",

      importance:
        ["high", "medium", "low"].includes(section.importance)
          ? section.importance
          : "medium",

      order:
        typeof section.order === "number"
          ? section.order
          : index,
    }))
    .filter((section) => section.content.length > 20)
    .sort((a, b) => a.order - b.order);
}

function normalize(data = {}) {
  return {
    notes: safeString(data.notes),
    sections: safeSections(data.sections),
  };
}

export async function generateSynthesis({
  memory,
  goal = "student",
  language = "english",
}) {
  if (!memory || typeof memory !== "object") {
    throw new Error("Memory object is required.");
  }

  const prompt = getSynthesisPrompt({
    goal,
    language,
  });

  const data = await generate({
    prompt,
    transcript: JSON.stringify(memory),
    model: "SMART",
    maxTokens: TOKEN_LIMITS.NOTES,
  });

  const result = normalize(data);

  if (
    !result.notes &&
    result.sections.length === 0
  ) {
    return EMPTY_RESULT;
  }

  return result;
}

export default generateSynthesis;