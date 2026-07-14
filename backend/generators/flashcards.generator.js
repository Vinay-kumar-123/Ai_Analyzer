import { generate } from "./shared/generator.base.js";
import { TOKEN_LIMITS } from "./shared/openai.client.js";

import { getFlashcardsPrompt } from "../prompts/flashcards.prompt.js";

import {
  safeFlashcards,
} from "../services/shared/content.normalizer.js";

/**
 * ============================================================================
 * AI Learning OS
 * Flashcards Generator
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate spaced-repetition flashcards from transcript.
 *
 * Input:
 * - transcript
 * - goal
 * - language
 *
 * Output:
 * {
 *   flashcards: []
 * }
 *
 * This generator ONLY generates flashcards.
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({
  flashcards: [],
});

function validateTranscript(transcript) {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  if (!transcript.trim()) {
    throw new Error("Transcript is empty.");
  }
}

export async function generateFlashcards({
  transcript,
  goal = "student",
  language = "english",
}) {
  validateTranscript(transcript);

  const prompt = getFlashcardsPrompt({
    goal,
    language,
  });

  const response = await generate({
    prompt,
    transcript,
    model: "SMART",
    maxTokens: TOKEN_LIMITS.FLASHCARDS,
  });

  const flashcards = safeFlashcards(
    response?.flashcards,
  );

  if (!flashcards.length) {
    return EMPTY_RESULT;
  }

  return {
    flashcards,
  };
}

export default generateFlashcards;