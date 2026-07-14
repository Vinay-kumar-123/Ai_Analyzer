import { generate } from "./shared/generator.base.js";
import { TOKEN_LIMITS } from "./shared/openai.client.js";

import { getProjectPrompt } from "../prompts/project.prompt.js";

import {
  safeProject,
  safeActionEngine,
} from "../services/shared/content.normalizer.js";

/**
 * ============================================================================
 * AI Learning OS
 * Project Generator
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate:
 * - project
 * - actionEngine
 *
 * Input:
 * - transcript
 * - goal
 * - language
 *
 * Output:
 * {
 *   project: {},
 *   actionEngine: []
 * }
 *
 * This generator ONLY generates implementation projects.
 * ============================================================================
 */

const EMPTY_RESULT = Object.freeze({
  project: {},
  actionEngine: [],
});

function validateTranscript(transcript) {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  if (!transcript.trim()) {
    throw new Error("Transcript is empty.");
  }
}

export async function generateProject({
  transcript,
  goal = "student",
  language = "english",
}) {
  validateTranscript(transcript);

  const prompt = getProjectPrompt({
    goal,
    language,
  });

  const response = await generate({
    prompt,
    transcript,
    model: "SMART",
    maxTokens: TOKEN_LIMITS.PROJECT,
  });

  const project = safeProject(response?.project);

  const actionEngine = safeActionEngine(
    response?.actionEngine,
  );

  const hasProject =
    Object.keys(project).length > 0 &&
    (
      project.title ||
      project.description ||
      project.implementation
    );

  if (!hasProject && actionEngine.length === 0) {
    return EMPTY_RESULT;
  }

  return {
    project,
    actionEngine,
  };
}

export default generateProject;