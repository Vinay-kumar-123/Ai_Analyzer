import { generate } from "./shared/generator.base.js";
import { TOKEN_LIMITS } from "./shared/openai.client.js";

import { getRoadmapPrompt } from "../prompts/roadmap.prompt.js";

import {
  safeRoadmap,
  safeLearningPath,
  safeExecutionPlan,
} from "../services/shared/content.normalizer.js";

/**
 * ============================================================================
 * AI Learning OS
 * Roadmap Generator
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate roadmap, learningPath, executionPlan from transcript.
 *
 * Input:  transcript, goal, language
 * Output: { roadmap: [], learningPath: [], executionPlan: [] }
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({
  roadmap: [],
  learningPath: [],
  executionPlan: [],
});

/**
 * Maximum characters sent to the AI per request.
 *
 * The account GPT-4o tier is 30,000 TPM.
 * A full transcript (~180,000 chars) costs ~52,000 tokens per request
 * which exceeds the limit deterministically and always returns 429.
 * 100,000 chars ≈ 25,000 tokens, leaving ~5,000 tokens for prompt + output.
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

export async function generateRoadmap({
  notesV3,
  transcript,
  goal = "student",
  language = "english",
}) {
  const inputSource = notesV3
    ? typeof notesV3 === "string" ? notesV3 : JSON.stringify(notesV3)
    : transcript;

  if (!inputSource || (typeof inputSource === "string" && !inputSource.trim())) {
    return EMPTY_RESULT;
  }

  // Truncate to fit within the 30k TPM limit for GPT-4o.
  const safeTranscript =
    inputSource.length > MAX_TRANSCRIPT_CHARS_FOR_AI
      ? inputSource.slice(0, MAX_TRANSCRIPT_CHARS_FOR_AI)
      : inputSource;

  const prompt = getRoadmapPrompt({ goal, language });

  const response = await generate({
    prompt,
    transcript: safeTranscript,
    model: "SMART",
    maxTokens: TOKEN_LIMITS.ROADMAP,
  });

  const roadmap = safeRoadmap(response?.roadmap);
  const learningPath = safeLearningPath(response?.learningPath);
  const executionPlan = safeExecutionPlan(response?.executionPlan);

  if (roadmap.length === 0 && learningPath.length === 0 && executionPlan.length === 0) {
    return EMPTY_RESULT;
  }

  return { roadmap, learningPath, executionPlan };
}

export default generateRoadmap;
