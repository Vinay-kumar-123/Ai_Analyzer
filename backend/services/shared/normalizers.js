/**
 * ============================================================================
 * AI Learning OS
 * Normalizers
 * ----------------------------------------------------------------------------
 * Central export file for all normalization utilities.
 *
 * Import this file everywhere instead of importing individual normalizers.
 *
 * Example:
 *
 * import {
 *   safeString,
 *   safeQuiz,
 *   normalizeOutput,
 * } from "./shared/normalizers.js";
 *
 * ============================================================================
 */

export * from "./primitive.normalizer.js";
export * from "./content.normalizer.js";