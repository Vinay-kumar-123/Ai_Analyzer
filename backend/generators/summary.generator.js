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
  transcript,
  goal = "student",
  language = "english",
}) {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  const prompt = getSummaryPrompt({
    goal,
    language,
  });

  const data = await generate({
    prompt,
    transcript,
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