import { TOKEN_LIMITS } from "./shared/openai.client.js";
import { generate } from "./shared/generator.base.js";
import { getSummaryPrompt } from "../prompts/summary.prompt.js";

/**
 * ============================================================================
 * AI Learning OS
 * Summary Generator
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate initial lightweight analysis.
 *
 * Generates ONLY:
 * - contentType
 * - summary
 * - outcome
 * - keyPoints
 *
 * ============================================================================
 */

export async function generateSummary({
  notesV3,
  transcript,
  goal = "student",
  language = "english",
}) {
  const inputSource = notesV3
    ? typeof notesV3 === "string" ? notesV3 : JSON.stringify(notesV3)
    : transcript;

  if (!inputSource || typeof inputSource !== "string") {
    throw new Error("Notes V3 or Transcript is required.");
  }

  const prompt = getSummaryPrompt({
    goal,
    language,
  });

  const data = await generate({
    prompt,
    transcript: inputSource,
    model: "FAST",
    maxTokens: TOKEN_LIMITS.SUMMARY,
  });

  return {
    contentType:
      typeof data.contentType === "string"
        ? data.contentType.toLowerCase()
        : "general",

    summary:
      typeof data.summary === "string"
        ? data.summary.trim()
        : "",

    outcome:
      typeof data.outcome === "string"
        ? data.outcome.trim()
        : "",

    keyPoints: Array.isArray(data.keyPoints)
      ? data.keyPoints.filter(Boolean)
      : [],
  };
}

export default generateSummary;