/**
 * ============================================================================
 * AI Learning OS
 * Prompt Builder
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Builds the final system prompt by combining:
 *
 * - Base Prompt
 * - Quality Prompt
 * - Content Type Prompt
 * - Output Schema Prompt
 * - Feature Prompt
 *
 * This file NEVER talks to OpenAI.
 * This file ONLY assembles prompts.
 * ============================================================================
 */

import { BASE_SYSTEM_PROMPT } from "../shared/base.prompt.js";
import { QUALITY_PROMPT } from "../shared/quality.prompt.js";
import { CONTENT_TYPE_PROMPT } from "../shared/content-type.prompt.js";
import { OUTPUT_SCHEMA_PROMPT } from "../shared/output-schema.prompt.js";

/**
 * Builds a production-ready system prompt.
 *
 * @param {Object} options
 * @param {string} options.featurePrompt
 * @param {string} options.goal
 * @param {string} options.language
 * @returns {string}
 */
export function buildPrompt({
  featurePrompt = "",
  goal = "student",
  language = "english",
} = {}) {
  return `
${BASE_SYSTEM_PROMPT}

==================================================
USER CONTEXT
==================================================

Learning Goal:
${goal}

Preferred Language:
${language}

==================================================

${QUALITY_PROMPT}

==================================================

${CONTENT_TYPE_PROMPT}

==================================================

${featurePrompt}

==================================================
LANGUAGE CONFORMITY
==================================================

You MUST write all generated text fields, content, summaries, descriptions, notes, roadmaps, questions, options, and explanations in the following language: ${language}.
Ensure that every single string value returned in the JSON object is written in ${language}.

==================================================

${OUTPUT_SCHEMA_PROMPT}
`;
}