/**
 * ============================================================================
 * AI Learning OS
 * AI Response Utilities
 * ----------------------------------------------------------------------------
 * Responsibility:
 * - Safe JSON parsing
 * - Markdown cleanup
 * - JSON extraction
 * - Empty response detection
 * - AI response validation
 * ============================================================================
 */

/**
 * Removes markdown code fences.
 */
export function stripMarkdown(text = "") {
  return String(text)
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

/**
 * Extract first valid JSON object.
 */
export function extractJSONObject(text = "") {
  const cleaned = stripMarkdown(text);

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    return cleaned;
  }

  return cleaned.substring(start, end + 1);
}

/**
 * Safe JSON parse.
 */
export function safeParseAIResponse(text = "") {
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {}

  try {
    return JSON.parse(stripMarkdown(text));
  } catch {}

  try {
    return JSON.parse(extractJSONObject(text));
  } catch {}

  return {};
}

/**
 * Checks whether response contains usable data.
 */
export function hasContent(data) {
  if (!data) return false;

  if (Array.isArray(data)) {
    return data.length > 0;
  }

  if (typeof data === "string") {
    return data.trim().length > 0;
  }

  if (typeof data === "object") {
    return Object.keys(data).length > 0;
  }

  return Boolean(data);
}

/**
 * Throws when AI returned invalid JSON.
 */
export function validateAIResponse(data) {
  if (!hasContent(data)) {
    throw new Error("AI returned empty response.");
  }

  if (typeof data !== "object") {
    throw new Error("AI returned invalid JSON.");
  }

  return data;
}

/**
 * Parse + validate.
 */
export function parseAIResponse(text = "") {
  const parsed = safeParseAIResponse(text);

  return validateAIResponse(parsed);
}

/**
 * Helper for generators.
 */
export function getAIContent(response) {
  return response?.content ?? "";
}