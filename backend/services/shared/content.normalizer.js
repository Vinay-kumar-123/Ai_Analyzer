/**
 * ============================================================================
 * AI Learning OS
 * Content Normalizer
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Normalize all AI generated business objects.
 *
 * Uses primitive.normalizer.js
 * ============================================================================
 */

import {
  safeString,
  safeArray,
  safeStringArray,
  safeObject,
  uniqueArray,
  limitArray,
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

const VALID_DIFFICULTY = new Set([
  "easy",
  "medium",
  "hard",
]);

const VALID_IMPORTANCE = new Set([
  "high",
  "medium",
  "low",
]);

/* ============================================================================
   Notes Sections
============================================================================ */

export function safeSections(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((section, index) => ({
      title: safeString(section.title) || `Section ${index + 1}`,

      content: safeString(section.content),

      type: VALID_SECTION_TYPES.has(section.type)
        ? section.type
        : "core_concept",

      importance: VALID_IMPORTANCE.has(section.importance)
        ? section.importance
        : "medium",

      order:
        Number.isFinite(section.order)
          ? section.order
          : index,
    }))
    .filter((section) => section.content.length > 20)
    .sort((a, b) => a.order - b.order);
}

/* ============================================================================
   Quiz
============================================================================ */

export function safeQuiz(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((item) => {
      const options = safeStringArray(item.options).slice(0, 4);

      return {
        question: safeString(item.question),

        options,

        correctAnswerIndex:
          Number.isInteger(item.correctAnswerIndex)
            ? Math.max(
                0,
                Math.min(3, item.correctAnswerIndex),
              )
            : 0,

        explanation: safeString(item.explanation),

        difficulty: VALID_DIFFICULTY.has(item.difficulty)
          ? item.difficulty
          : "medium",
      };
    })
    .filter(
      (q) =>
        q.question &&
        q.options.length === 4,
    )
    .slice(0, 50);
}

/* ============================================================================
   Flashcards
============================================================================ */

export function safeFlashcards(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((card) => ({
      front: safeString(card.front),
      back: safeString(card.back),
    }))
    .filter(
      (card) =>
        card.front &&
        card.back,
    )
    .slice(0, 200);
}

/* ============================================================================
   Question & Answer
============================================================================ */

export function safeQA(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((item) => ({
      question: safeString(item.question),
      answer: safeString(item.answer),
    }))
    .filter(
      (item) =>
        item.question &&
        item.answer,
    );
}

/* ============================================================================
   Roadmap
============================================================================ */

export function safeRoadmap(value) {
  return uniqueArray(
    safeStringArray(value),
  ).slice(0, 50);
}

export function safeLearningPath(value) {
  return uniqueArray(
    safeStringArray(value),
  ).slice(0, 100);
}

/* ============================================================================
   Project
============================================================================ */

export function safeProject(value) {
  const project = safeObject(value);

  return {
    title: safeString(project.title),

    description: safeString(project.description),

    difficulty: VALID_DIFFICULTY.has(project.difficulty)
      ? project.difficulty
      : "medium",

    architecture: safeString(project.architecture),

    implementation: safeString(project.implementation),

    starterCode: safeString(project.starterCode),

    folderStructure: safeString(project.folderStructure),
  };
}

/* ============================================================================
   Action Engine
============================================================================ */

export function safeActionEngine(value) {
  return limitArray(
    safeStringArray(value),
    100,
  );
}

/* ============================================================================
   Execution Plan
============================================================================ */

export function safeExecutionPlan(value) {
  return limitArray(
    safeStringArray(value),
    100,
  );
}

/* ============================================================================
   Confusion Points
============================================================================ */

export function safeConfusion(value) {
  return limitArray(
    safeStringArray(value),
    50,
  );
}

/* ============================================================================
   Final Output
============================================================================ */

export function normalizeOutput(data = {}) {
  const result = safeObject(data);

  return {
    contentType: safeString(result.contentType).toLowerCase() || "general",

    summary: safeString(result.summary),

    outcome: safeString(result.outcome),

    notes: safeString(result.notes),

    keyPoints: uniqueArray(
      safeStringArray(result.keyPoints),
    ),

    sections: safeSections(result.sections),

    quiz: safeQuiz(result.quiz),

    flashcards: safeFlashcards(result.flashcards),

    qa: safeQA(result.qa),

    roadmap: safeRoadmap(result.roadmap),

    learningPath: safeLearningPath(result.learningPath),

    project: safeProject(result.project),

    actionEngine: safeActionEngine(result.actionEngine),

    executionPlan: safeExecutionPlan(result.executionPlan),

    confusion: safeConfusion(result.confusion),
  };
}