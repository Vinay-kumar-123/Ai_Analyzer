/**
 * ============================================================================
 * AI Learning OS
 * Primitive Normalizer
 * ----------------------------------------------------------------------------
 * Shared primitive normalization utilities.
 *
 * Responsibilities:
 * - Type safety
 * - JSON parsing
 * - Markdown cleanup
 * - Array sanitization
 * - Object sanitization
 * - Deduplication
 *
 * This file contains NO business logic.
 * ============================================================================
 */

/**
 * Safe string.
 */
export function safeString(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

/**
 * Safe number.
 */
export function safeNumber(value, fallback = 0) {
  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;
}

/**
 * Safe boolean.
 */
export function safeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
}

/**
 * Safe object.
 */
export function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

/**
 * Safe array.
 */
export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Safe string array.
 */
export function safeStringArray(value) {
  return safeArray(value)
    .map((item) => safeString(item))
    .filter(Boolean);
}

/**
 * Remove duplicates.
 */
export function uniqueArray(value = []) {
  return [...new Set(safeArray(value))];
}

/**
 * Limit array length.
 */
export function limitArray(value, max = 100) {
  return safeArray(value).slice(0, max);
}

/**
 * Remove markdown fences.
 */
export function cleanMarkdown(text = "") {
  return safeString(text)
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

/**
 * Extract JSON object from markdown/text.
 */
export function extractJSONObject(text = "") {
  const cleaned = cleanMarkdown(text);

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    return cleaned;
  }

  return cleaned.substring(start, end + 1);
}

/**
 * Safe JSON parser.
 */
export function safeParse(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {}

  try {
    return JSON.parse(cleanMarkdown(value));
  } catch {}

  try {
    return JSON.parse(extractJSONObject(value));
  } catch {}

  return fallback;
}

/**
 * Remove empty values.
 */
export function compactArray(value = []) {
  return safeArray(value).filter(Boolean);
}

/**
 * Normalize text block.
 */
export function normalizeText(value) {
  return safeString(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Deep clone.
 */
export function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}
