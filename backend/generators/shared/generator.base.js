import { sendAIRequest } from "./ai.request.js";
import { parseAIResponse } from "./ai.response.js";
import { withRetry } from "./ai.retry.js";

/**
 * ============================================================================
 * AI Learning OS
 * Base Generator
 * ----------------------------------------------------------------------------
 * Shared execution layer used by every AI generator.
 *
 * Responsibilities:
 * - Retry
 * - OpenAI request
 * - JSON parsing
 * - Validation
 * - Error normalization
 *
 * Never call OpenAI directly from feature generators.
 * ============================================================================
 */

/**
 * Executes an AI generation pipeline.
 *
 * @param {Object} options
 * @param {string} options.systemPrompt
 * @param {string} options.userPrompt
 * @param {"FAST"|"SMART"} [options.model]
 * @param {number} [options.maxTokens]
 * @param {number} [options.temperature]
 * @param {boolean} [options.responseFormat]
 *
 * @returns {Promise<Object>}
 */
export async function executeGenerator({
  systemPrompt,
  userPrompt,
  model = "FAST",
  maxTokens = 3000,
  temperature = 0.2,
  responseFormat = true,
}) {
  if (!systemPrompt) {
    throw new Error("Missing systemPrompt.");
  }

  if (!userPrompt) {
    throw new Error("Missing userPrompt.");
  }

  const response = await withRetry(() =>
    sendAIRequest({
      systemPrompt,
      userPrompt,
      model,
      maxTokens,
      temperature,
      responseFormat,
    }),
  );

  if (!response.success) {
    throw new Error(
      response.error?.message || "AI request failed.",
    );
  }

  const parsed = parseAIResponse(response.content);

  return {
    data: parsed,

    usage: response.usage || {},

    model: response.model,

    finishReason: response.finishReason,
  };
}

/**
 * Convenience helper for generators.
 */
export async function generate({
  prompt,
  transcript,
  model = "FAST",
  maxTokens = 3000,
}) {
  const result = await executeGenerator({
    systemPrompt: prompt,
    userPrompt: transcript,
    model,
    maxTokens,
  });

  return result.data;
}

export default generate;