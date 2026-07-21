/**
 * ============================================================================
 * AI Learning OS
 * Knowledge Core Reader (Access Layer)
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Stable abstraction layer for consuming Knowledge Core primitives.
 *
 * Future generators (Flashcards, Mind Maps, Cheat Sheets, AI Tutor, etc.)
 * MUST use these helper methods instead of directly traversing the raw
 * MongoDB object. This guarantees that future schema migrations will never
 * break downstream generators.
 * ============================================================================
 */

/**
 * Ensures we have a valid Knowledge Core object (or fallback if empty).
 */
export function getCore(analysis) {
  if (!analysis) return null;
  return analysis.knowledgeCore || null;
}

/**
 * Returns metadata block with default safe fallbacks.
 */
export function getMetadata(kc) {
  return kc?.metadata || {
    schemaVersion: "v1",
    aiVersion: "v5",
    promptVersion: "v1",
    domain: "general",
    level: "beginner",
    sourceType: "youtube",
  };
}

/**
 * Returns list of topics with stable IDs.
 * @returns {Array<{ id: string, name: string }>}
 */
export function getTopics(kc) {
  if (!kc?.topics) return [];
  return kc.topics.map((t, i) =>
    typeof t === "string" ? { id: `topic-${i + 1}`, name: t } : t
  );
}

/**
 * Returns concepts with IDs, explanations, importance, confidence.
 * @returns {Array<{ id: string, name: string, explanation: string, importance: string, confidence: number }>}
 */
export function getConcepts(kc) {
  return Array.isArray(kc?.concepts) ? kc.concepts : [];
}

/**
 * Returns definitions with term and definition.
 * @returns {Array<{ id: string, term: string, definition: string, confidence: number }>}
 */
export function getDefinitions(kc) {
  return Array.isArray(kc?.definitions) ? kc.definitions : [];
}

/**
 * Returns comparisons between two subjects.
 * @returns {Array<{ id: string, subjectA: string, subjectB: string, difference: string, confidence: number }>}
 */
export function getComparisons(kc) {
  return Array.isArray(kc?.comparisons) ? kc.comparisons : [];
}

/**
 * Returns CLI / Terminal / Code commands extracted deterministically.
 * @returns {Array<string>}
 */
export function getCommands(kc) {
  return Array.isArray(kc?.commands) ? kc.commands : [];
}

/**
 * Returns mathematical or logical formulas.
 * @returns {Array<{ id: string, name: string, formula: string, explanation: string, confidence: number }>}
 */
export function getFormulas(kc) {
  return Array.isArray(kc?.formulas) ? kc.formulas : [];
}

/**
 * Returns glossary terms.
 * @returns {Array<{ id: string, term: string, definition: string }>}
 */
export function getGlossary(kc) {
  return Array.isArray(kc?.glossary) ? kc.glossary : [];
}

/**
 * Returns graph-ready relationships between concepts/topics.
 * @returns {Array<{ id: string, sourceId: string, targetId: string, relationship: string, confidence: number }>}
 */
export function getRelationships(kc) {
  return Array.isArray(kc?.relationships) ? kc.relationships : [];
}

/**
 * Returns prerequisites needed before learning this content.
 * @returns {Array<string>}
 */
export function getPrerequisites(kc) {
  return Array.isArray(kc?.prerequisites) ? kc.prerequisites : [];
}

/**
 * Returns real-world examples.
 * @returns {Array<string>}
 */
export function getRealWorldExamples(kc) {
  return Array.isArray(kc?.realWorldExamples) ? kc.realWorldExamples : [];
}

/**
 * Returns best practices.
 * @returns {Array<string>}
 */
export function getBestPractices(kc) {
  return Array.isArray(kc?.bestPractices) ? kc.bestPractices : [];
}

/**
 * Returns common mistakes to avoid.
 * @returns {Array<string>}
 */
export function getCommonMistakes(kc) {
  return Array.isArray(kc?.commonMistakes) ? kc.commonMistakes : [];
}

/**
 * Returns quick revision points.
 * @returns {Array<string>}
 */
export function getRevisionPoints(kc) {
  return Array.isArray(kc?.revisionPoints) ? kc.revisionPoints : [];
}

/**
 * Returns interview insights and tips.
 * @returns {Array<string>}
 */
export function getInterviewInsights(kc) {
  return Array.isArray(kc?.interviewInsights) ? kc.interviewInsights : [];
}

/**
 * Returns step-by-step timeline or procedural workflow.
 * @returns {Array<{ step: number|string, title: string, description: string }>}
 */
export function getTimeline(kc) {
  return Array.isArray(kc?.timeline) ? kc.timeline : [];
}

/**
 * Returns external references or URLs.
 * @returns {Array<string>}
 */
export function getReferences(kc) {
  return Array.isArray(kc?.references) ? kc.references : [];
}

export default {
  getCore,
  getMetadata,
  getTopics,
  getConcepts,
  getDefinitions,
  getComparisons,
  getCommands,
  getFormulas,
  getGlossary,
  getRelationships,
  getPrerequisites,
  getRealWorldExamples,
  getBestPractices,
  getCommonMistakes,
  getRevisionPoints,
  getInterviewInsights,
  getTimeline,
  getReferences,
};
