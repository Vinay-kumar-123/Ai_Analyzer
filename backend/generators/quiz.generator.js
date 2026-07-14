import { generate } from "./shared/generator.base.js";
import { TOKEN_LIMITS } from "./shared/openai.client.js";

import { getQuizPrompt } from "../prompts/quiz.prompt.js";

import {
  safeQuiz,
} from "../services/shared/content.normalizer.js";

/**
 * ============================================================================
 * AI Learning OS
 * Quiz Generator
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate production-ready MCQs from transcript.
 *
 * Input:
 * - transcript
 * - goal
 * - language
 *
 * Output:
 * {
 *   quiz: [...]
 * }
 *
 * This generator ONLY generates quizzes.
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({
  quiz: [],
});

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

  const prompt = getQuizPrompt({
    goal,
    language,
  });

  const response = await generate({
    prompt,
    transcript,
    model: "SMART",
    maxTokens: TOKEN_LIMITS.QUIZ,
  });

  const quiz = safeQuiz(response?.quiz);

  if (!quiz.length) {
    return EMPTY_RESULT;
  }

  return {
    quiz,
  };
}

export default generateQuiz;