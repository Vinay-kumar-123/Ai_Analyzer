/**
 * ============================================================================
 * AI Learning OS
 * Generator Registry
 * ----------------------------------------------------------------------------
 * Central registry for all AI generators.
 *
 * MVP generators:
 *   notes · quiz · roadmap
 *
 * Notes uses a chunk+synthesis pipeline (see notes.generator.js).
 * Quiz and Roadmap send a truncated transcript to a single SMART model call.
 * ============================================================================
 */

import { generateNotes   } from "./notes.generator.js";
import { generateQuiz    } from "./quiz.generator.js";
import { generateRoadmap } from "./roadmap.generator.js";

export const GENERATORS = Object.freeze({
  notes:   generateNotes,
  quiz:    generateQuiz,
  roadmap: generateRoadmap,
});

export function hasGenerator(type) {
  return Object.prototype.hasOwnProperty.call(GENERATORS, type);
}

export function getGenerator(type) {
  if (!hasGenerator(type)) {
    throw new Error(`Unsupported generator: "${type}". Available: ${Object.keys(GENERATORS).join(", ")}`);
  }
  return GENERATORS[type];
}

export function getAvailableGenerators() {
  return Object.keys(GENERATORS);
}

export async function executeGenerator(type, payload) {
  const generator = getGenerator(type);
  return generator(payload);
}

export default GENERATORS;
