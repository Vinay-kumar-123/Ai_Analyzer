/**
 * ============================================================================
 * AI Learning OS
 * Memory Builder
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Build a unified learning memory from all chunk analysis results.
 *
 * Used by:
 * - notes.generator.js
 * - quiz.generator.js
 * - flashcards.generator.js
 * - roadmap.generator.js
 * - project.generator.js
 * ============================================================================
 */

function normalizeString(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeString)
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function mergeText(parts) {
  return parts
    .map(normalizeString)
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Build merged AI memory.
 */
export function buildMemory(chunkResults = []) {
  if (!Array.isArray(chunkResults)) {
    throw new Error("chunkResults must be an array.");
  }

  return {
    concepts: unique(
      chunkResults.flatMap((item) =>
        normalizeArray(item.concepts),
      ),
    ),

    keyPoints: unique(
      chunkResults.flatMap((item) =>
        normalizeArray(item.keyPoints),
      ),
    ),

    examples: unique(
      chunkResults.flatMap((item) =>
        normalizeArray(item.examples),
      ),
    ),

    formulas: unique(
      chunkResults.flatMap((item) =>
        normalizeArray(item.formulas),
      ),
    ),

    warnings: unique(
      chunkResults.flatMap((item) =>
        normalizeArray(item.warnings),
      ),
    ),

    revisionPoints: unique(
      chunkResults.flatMap((item) =>
        normalizeArray(item.revisionPoints),
      ),
    ),

    interviewInsights: unique(
      chunkResults.flatMap((item) =>
        normalizeArray(item.interviewInsights),
      ),
    ),

    codeSnippets: unique(
      chunkResults.flatMap((item) =>
        normalizeArray(item.codeSnippets),
      ),
    ),

    notes: mergeText(
      chunkResults.map((item) => item.notes),
    ),
  };
}

/**
 * Lightweight statistics.
 */
export function getMemoryStats(memory) {
  return {
    concepts: memory.concepts.length,

    keyPoints: memory.keyPoints.length,

    examples: memory.examples.length,

    formulas: memory.formulas.length,

    warnings: memory.warnings.length,

    revisionPoints:
      memory.revisionPoints.length,

    interviewInsights:
      memory.interviewInsights.length,

    codeSnippets:
      memory.codeSnippets.length,

    notesLength:
      memory.notes.length,
  };
}

export default buildMemory;