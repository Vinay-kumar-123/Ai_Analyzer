/**
 * ============================================================================
 * AI Learning OS
 * Generator Registry
 * ----------------------------------------------------------------------------
 * Central registry for all AI generators.
 *
 * Responsibilities:
 * - Register generators
 * - Resolve generator by type
 * - Prevent invalid generator calls
 * - Single source of truth
 *
 * ============================================================================
 */

import { generateNotes } from "./notes.generator.js";
import { generateQuiz } from "./quiz.generator.js";
import { generateFlashcards } from "./flashcards.generator.js";
import { generateRoadmap } from "./roadmap.generator.js";
import { generateProject } from "./project.generator.js";

/**
 * Registered generators.
 */
export const GENERATORS = Object.freeze({
  notes: generateNotes,
  quiz: generateQuiz,
  flashcards: generateFlashcards,
  roadmap: generateRoadmap,
  project: generateProject,
});

/**
 * Check whether a generator exists.
 */
export function hasGenerator(type) {
  return Object.prototype.hasOwnProperty.call(
    GENERATORS,
    type,
  );
}

/**
 * Return generator function.
 */
export function getGenerator(type) {
  if (!hasGenerator(type)) {
    throw new Error(
      `Unsupported generator: ${type}`,
    );
  }

  return GENERATORS[type];
}

/**
 * Return all supported generator names.
 */
export function getAvailableGenerators() {
  return Object.keys(GENERATORS);
}

/**
 * Execute a generator.
 */
export async function executeGenerator(
  type,
  payload,
) {
  const generator = getGenerator(type);

  return generator(payload);
}

export default GENERATORS;