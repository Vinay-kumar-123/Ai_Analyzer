/**
 * ============================================================================
 * AI Learning OS
 * Content Normalizer
 * ----------------------------------------------------------------------------
 * Normalizes AI-generated output for the current MVP:
 *   Summary · Key Points · Notes · Roadmap · Quiz
 * ============================================================================
 */

import {
  safeString,
  safeArray,
  safeStringArray,
  safeObject,
  uniqueArray,
} from "./primitive.normalizer.js";

const VALID_SECTION_TYPES = new Set([
  "introduction",
  "core_concept",
  "example",
  "advanced",
  "interview",
  "revision",
  "warning",
  "summary",
  "code",
  "project",
]);

const VALID_DIFFICULTY = new Set(["easy", "medium", "hard"]);
const VALID_IMPORTANCE  = new Set(["high", "medium", "low"]);

// ─── Notes Sections ────────────────────────────────────────────────────────────

export function safeSections(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((section, index) => ({
      title: safeString(section.title) || `Section ${index + 1}`,
      content: safeString(section.content),
      type: VALID_SECTION_TYPES.has(section.type) ? section.type : "core_concept",
      importance: VALID_IMPORTANCE.has(section.importance) ? section.importance : "medium",
      order: Number.isFinite(section.order) ? section.order : index,
    }))
    .filter((s) => s.content.length > 20)
    .sort((a, b) => a.order - b.order);
}

// ─── Quiz ──────────────────────────────────────────────────────────────────────

export function safeQuiz(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((item) => {
      const options = safeStringArray(item.options).slice(0, 4);
      return {
        question: safeString(item.question),
        options,
        correctAnswerIndex: Number.isInteger(item.correctAnswerIndex)
          ? Math.max(0, Math.min(3, item.correctAnswerIndex))
          : 0,
        explanation: safeString(item.explanation),
        difficulty: VALID_DIFFICULTY.has(item.difficulty) ? item.difficulty : "medium",
      };
    })
    .filter((q) => q.question && q.options.length === 4)
    .slice(0, 50);
}

// ─── Roadmap ───────────────────────────────────────────────────────────────────

export function safeRoadmap(value) {
  return uniqueArray(safeStringArray(value)).slice(0, 50);
}

export function safeLearningPath(value) {
  return uniqueArray(safeStringArray(value)).slice(0, 100);
}

export function safeExecutionPlan(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((item) => ({
      day:  safeString(item.day),
      task: safeString(item.task),
    }))
    .filter((item) => item.day || item.task)
    .slice(0, 100);
}

// ─── Final Output ──────────────────────────────────────────────────────────────

export function normalizeOutput(data = {}) {
  const result = safeObject(data);

  return {
    contentType: safeString(result.contentType).toLowerCase() || "general",
    summary:     safeString(result.summary),
    outcome:     safeString(result.outcome),
    notes:       safeString(result.notes),
    keyPoints:   uniqueArray(safeStringArray(result.keyPoints)),
    sections:    safeSections(result.sections),
    quiz:        safeQuiz(result.quiz),
    roadmap:     safeRoadmap(result.roadmap),
    learningPath: safeLearningPath(result.learningPath),
    executionPlan: safeExecutionPlan(result.executionPlan),
  };
}
