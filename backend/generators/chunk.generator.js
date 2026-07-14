import { TOKEN_LIMITS } from "./shared/openai.client.js";
import { generate } from "./shared/generator.base.js";
import { getChunkPrompt } from "../prompts/chunk.prompt.js";

/**
 * ============================================================================
 * AI Learning OS
 * Chunk Generator
 * ============================================================================
 *
 * Responsibility:
 * Analyze ONE transcript chunk and convert it into structured learning memory.
 *
 * This generator NEVER creates:
 * - sections
 * - summary
 * - final notes
 * - quiz
 * - flashcards
 *
 * It only extracts intermediate learning memory.
 *
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({
  concepts: [],
  keyPoints: [],
  notes: "",
  examples: [],
  formulas: [],
  warnings: [],
  codeSnippets: [],
  revisionPoints: [],
  interviewInsights: [],
});

function safeArray(value) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((v) =>
          typeof v === "string"
            ? v.trim()
            : String(v).trim(),
        )
        .filter(Boolean),
    ),
  ];
}

function safeString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalize(data = {}) {
  return {
    concepts: safeArray(data.concepts),

    keyPoints: safeArray(data.keyPoints),

    notes: safeString(data.notes),

    examples: safeArray(data.examples),

    formulas: safeArray(data.formulas),

    warnings: safeArray(data.warnings),

    codeSnippets: safeArray(data.codeSnippets),

    revisionPoints: safeArray(data.revisionPoints),

    interviewInsights: safeArray(data.interviewInsights),
  };
}

export async function generateChunk({
  chunk,
  goal = "student",
  language = "english",
  chunkIndex = 0,
  totalChunks = 1,
}) {
  if (!chunk || typeof chunk !== "string") {
    throw new Error("Transcript chunk is required.");
  }

  const prompt = getChunkPrompt({
    goal,
    language,
  });

  const transcript = `
Chunk ${chunkIndex + 1} of ${totalChunks}

----------------------------------------

${chunk}
`;

  const data = await generate({
    prompt,
    transcript,
    model: "FAST",
    maxTokens: TOKEN_LIMITS.NOTES,
  });

  const result = normalize(data);

  if (
    !result.notes &&
    result.concepts.length === 0 &&
    result.keyPoints.length === 0
  ) {
    return EMPTY_RESULT;
  }

  return result;
}

export default generateChunk;