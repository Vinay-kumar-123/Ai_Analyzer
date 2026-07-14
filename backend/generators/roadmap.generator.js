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
 * Generate:
 * - roadmap
 * - learningPath
 * - executionPlan
 *
 * Input:
 * - transcript
 * - goal
 * - language
 *
 * Output:
 * {
 *   roadmap: [],
 *   learningPath: [],
 *   executionPlan: []
 * }
 *
 * This generator ONLY generates learning roadmap content.
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({
  roadmap: [],
  learningPath: [],
  executionPlan: [],
});

function validateTranscript(transcript) {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  if (!transcript.trim()) {
    throw new Error("Transcript is empty.");
  }
}

export async function generateRoadmap({
  transcript,
  goal = "student",
  language = "english",
}) {
  validateTranscript(transcript);

  const prompt = getRoadmapPrompt({
    goal,
    language,
  });

  const response = await generate({
    prompt,
    transcript,
    model: "SMART",
    maxTokens: TOKEN_LIMITS.ROADMAP,
  });

  const roadmap = safeRoadmap(response?.roadmap);
  const learningPath = safeLearningPath(response?.learningPath);
  const executionPlan = safeExecutionPlan(
    response?.executionPlan,
  );

  if (
    roadmap.length === 0 &&
    learningPath.length === 0 &&
    executionPlan.length === 0
  ) {
    return EMPTY_RESULT;
  }

  return {
    roadmap,
    learningPath,
    executionPlan,
  };
}

export default generateRoadmap;