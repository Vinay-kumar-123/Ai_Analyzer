import { TOKEN_LIMITS } from "./shared/openai.client.js";
import { generate } from "./shared/generator.base.js";
import { getSynthesisPrompt } from "../prompts/synthesis.prompt.js";
import { assembleKnowledgeCore } from "../services/knowledge/knowledgeCore.builder.js";
import { safeKnowledgeCore } from "../services/shared/content.normalizer.js";

/**
 * ============================================================================
 * AI Learning OS
 * Synthesis Generator — v2.5 (Knowledge Core Aware)
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({
  learningObjectives: "",
  notes: "",
  sections: [],
  knowledgeCore: null,
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

      difficulty:
        ["beginner", "intermediate", "advanced"].includes(section.difficulty)
          ? section.difficulty
          : "beginner",

      nextTopic:
        typeof section.nextTopic === "string"
          ? section.nextTopic.trim()
          : "",

      order:
        typeof section.order === "number"
          ? section.order
          : index,
    }))
    .filter((section) => section.content.length > 20)
    .sort((a, b) => a.order - b.order);
}

function normalize(data = {}, sourceMeta = {}, rawMemoryText = "") {
  // Hybrid extraction: merge AI semantic output + deterministic parsing
  const rawCore = assembleKnowledgeCore(data.knowledgeCore, sourceMeta, rawMemoryText);
  const knowledgeCore = safeKnowledgeCore(rawCore, sourceMeta);

  return {
    learningObjectives: safeString(data.learningObjectives),
    notes:              safeString(data.notes),
    sections:           safeSections(data.sections),
    knowledgeCore,
  };
}

export async function generateSynthesis({
  memory,
  goal = "student",
  language = "english",
  sourceMeta = {},
}) {
  if (!memory || typeof memory !== "object") {
    throw new Error("Memory object is required.");
  }

  const prompt = getSynthesisPrompt({
    goal,
    language,
  });

  const memoryString = JSON.stringify(memory);

  const data = await generate({
    prompt,
    transcript: memoryString,
    model: "SMART",
    maxTokens: TOKEN_LIMITS.NOTES,
  });

  const result = normalize(data, sourceMeta, memoryString);

  if (
    !result.notes &&
    !result.learningObjectives &&
    result.sections.length === 0
  ) {
    return EMPTY_RESULT;
  }

  return result;
}

export default generateSynthesis;