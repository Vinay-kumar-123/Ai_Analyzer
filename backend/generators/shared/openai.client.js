import OpenAI from "openai";

/**
 * ============================================================================
 * AI Learning OS
 * OpenAI Client
 * ----------------------------------------------------------------------------
 * Single OpenAI client instance used across the entire application.
 *
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
 * Models
 * ---------------------------------------------------------------------------
 * Change model here only.
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

  /**
   * 90 seconds
   */
  timeout: 90_000,

  /**
   * SDK retries.
   * Custom retry logic will live inside ai.retry.js
   */
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
 * Frequently used token limits.
 */
export const TOKEN_LIMITS = Object.freeze({
  SUMMARY: 2500,

  NOTES: 8000,

  QUIZ: 3500,

  FLASHCARDS: 3000,

  ROADMAP: 3000,

  PROJECT: 5000,
});

/**
 * Helper
 */
export function getModel(type = "FAST") {
  return AI_MODELS[type] || AI_MODELS.FAST;
}

export default openai;