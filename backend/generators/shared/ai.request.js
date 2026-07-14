import {
  openai,
  DEFAULT_AI_CONFIG,
  getModel,
} from "./openai.client.js";

/**
 * ============================================================================
 * AI Learning OS
 * AI Request Layer
 * ----------------------------------------------------------------------------
 * Responsibility:
 * - Centralized OpenAI requests
 * - Model selection
 * - Timeout handling (SDK)
 * - Usage tracking
 * - JSON mode
 * - Error normalization
 *
 * NEVER call openai.chat.completions.create()
 * directly from generators.
 * ============================================================================
 */

export async function sendAIRequest({
  systemPrompt,
  userPrompt,
  model = "FAST",
  maxTokens = 3000,
  temperature = DEFAULT_AI_CONFIG.temperature,
  responseFormat = true,
}) {
  try {
    const response = await openai.chat.completions.create({
      model: getModel(model),

      temperature,

      max_tokens: maxTokens,

      ...(responseFormat
        ? {
            response_format: {
              type: "json_object",
            },
          }
        : {}),

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    return {
      success: true,

      content:
        response?.choices?.[0]?.message?.content ?? "",

      usage: response?.usage ?? {},

      model: response?.model,

      finishReason:
        response?.choices?.[0]?.finish_reason ?? "unknown",
    };
  } catch (error) {
    return {
      success: false,

      error: {
        message:
          error?.message || "OpenAI request failed",

        code: error?.code || "UNKNOWN",

        type: error?.type || "REQUEST_ERROR",

        status:
          error?.status ||
          error?.statusCode ||
          500,
      },
    };
  }
}