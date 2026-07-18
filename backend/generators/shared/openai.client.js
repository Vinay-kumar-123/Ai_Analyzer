import OpenAI from "openai";

/**
 * ============================================================================
 * AI Learning OS
 * OpenAI Client
 * ----------------------------------------------------------------------------
 * Single OpenAI client instance used across the entire application.
 * DO NOT create new OpenAI() anywhere else.
 * ============================================================================
 */

const REQUIRED_ENV = ["OPENAI_API_KEY"];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

/**
 * Available models.
 * Change model strings here only — never hardcode them elsewhere.
 */
export const AI_MODELS = Object.freeze({
  FAST: "gpt-4o-mini",
  SMART: "gpt-4o",
});

/**
 * Shared OpenAI client.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 90_000,
  maxRetries: 0,
});

/**
 * Default generation configuration.
 */
export const DEFAULT_AI_CONFIG = Object.freeze({
  temperature: 0.2,
  top_p: 1,
});

/**
 * Token limits per feature.
 * FAST model is used for chunked notes processing; SMART for full generations.
 */
export const TOKEN_LIMITS = Object.freeze({
  SUMMARY: 2500,
  NOTES:   8000,
  QUIZ:    3500,
  ROADMAP: 3000,
});

/**
 * Resolve model alias to the actual model string.
 */
export function getModel(type = "FAST") {
  return AI_MODELS[type] || AI_MODELS.FAST;
}

export default openai;
