import { generate } from "./shared/generator.base.js";
import { TOKEN_LIMITS } from "./shared/openai.client.js";

import { getQuizPrompt } from "../prompts/quiz.prompt.js";

import { safeQuiz } from "../services/shared/content.normalizer.js";

/**
 * ============================================================================
 * AI Learning OS
 * Quiz Generator
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate production-ready MCQs from transcript.
 *
 * Input:  transcript, goal, language
 * Output: { quiz: [...] }
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({ quiz: [] });

/**
 * Maximum characters sent to the AI per request.
 *
 * The account GPT-4o tier is 30,000 TPM.
 * A full transcript costs ~52,000 tokens per request which always returns 429.
 * 100,000 chars ≈ 25,000 tokens, leaving headroom for prompt + output.
 */
const MAX_TRANSCRIPT_CHARS_FOR_AI = 100_000;

function validateTranscript(transcript) {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }
  if (!transcript.trim()) {
    throw new Error("Transcript is empty.");
  }
}

export async function generateQuiz({
  transcript,
  goal = "student",
  language = "english",
}) {
  validateTranscript(transcript);

  // Truncate to fit within the 30k TPM limit for GPT-4o.
  const safeTranscript =
    transcript.length > MAX_TRANSCRIPT_CHARS_FOR_AI
      ? transcript.slice(0, MAX_TRANSCRIPT_CHARS_FOR_AI)
      : transcript;

  const prompt = getQuizPrompt({ goal, language });

  const response = await generate({
    prompt,
    transcript: safeTranscript,
    model: "SMART",
    maxTokens: TOKEN_LIMITS.QUIZ,
  });

  const quiz = safeQuiz(response?.quiz);

  if (!quiz.length) {
    return EMPTY_RESULT;
  }

  return { quiz };
}

export default generateQuiz;
