/**
 * ============================================================================
 * AI Learning OS
 * AI Tutor Generator — v1
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Executes the OpenAI call for AI Tutor dialogue.
 *
 * Configured Model Strategy:
 * Uses getModel("FAST") dynamically from openai.client.js.
 * NEVER hardcodes model names. Changing the model in config updates this automatically.
 * ============================================================================
 */

import { executeGenerator } from "./shared/generator.base.js";
import { TOKEN_LIMITS, getModel } from "./shared/openai.client.js";
import { getTutorPrompt } from "../prompts/tutor.prompt.js";
import { pruneHistoryByTokens, enforceContextBudget } from "../services/tutor.service.js";

const DEFAULT_RESULT = Object.freeze({
  reply: "I am ready to help you study this video! Ask me anything.",
  followUpSuggestions: [
    "Explain this simply",
    "Give a real-world example",
    "Show common mistakes",
    "Ask me a quiz question",
  ],
});

/**
 * Generates an AI Tutor response grounded in the provided RAG context and rolling history.
 * Performs EXACTLY ONE OpenAI completion request.
 *
 * @param {Object} opts
 * @param {string} opts.question      - User's input question
 * @param {string} opts.ragContext    - RAG context payload
 * @param {Array}  [opts.history]     - Conversation history
 * @param {string} [opts.goal]        - User's goal
 * @param {string} [opts.language]    - Preferred language
 *
 * @returns {Promise<{ reply: string, followUpSuggestions: Array<string> }>}
 */
export async function generateTutorResponse({
  question,
  ragContext,
  history = [],
  goal = "student",
  language = "english",
}) {
  if (!question || typeof question !== "string") {
    throw new Error("Question string is required.");
  }

  const systemPrompt = getTutorPrompt({ goal, language });

  // Token-capped rolling history (~1,000 tokens max)
  const prunedHistory = pruneHistoryByTokens(history, 4000);

  // Format history string
  const historyString = prunedHistory
    .map((h) => `${h.role === "user" ? "Student" : "Tutor"}: ${h.content}`)
    .join("\n\n");

  // OVERALL CONTEXT BUDGET MANAGER: Caps total combined prompt to max 6,000 chars (~1,500 input tokens)
  const userPrompt = enforceContextBudget({
    ragContext,
    historyString,
    question,
  });

  const modelAlias = getModel("FAST"); // Configured FAST model (gpt-4o-mini dynamically)

  const result = await executeGenerator({
    systemPrompt,
    userPrompt,
    model: "FAST",
    maxTokens: TOKEN_LIMITS.SUMMARY || 2500,
    temperature: 0.3,
  });

  const data = result?.data || {};

  const reply = typeof data.reply === "string" && data.reply.trim()
    ? data.reply.trim()
    : "I analyzed the video context for your question, but could not formulate a clear response. Please try rephrasing.";

  const suggestions = Array.isArray(data.followUpSuggestions)
    ? data.followUpSuggestions.filter((s) => typeof s === "string" && s.trim()).slice(0, 4)
    : DEFAULT_RESULT.followUpSuggestions;

  return {
    reply,
    followUpSuggestions: suggestions,
  };
}

export default generateTutorResponse;
