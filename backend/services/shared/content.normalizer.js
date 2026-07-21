/**
 * ============================================================================
 * AI Learning OS
 * Content Normalizer
 * ----------------------------------------------------------------------------
 * Normalizes AI-generated output for all Result tabs:
 *   Summary · Key Points · Notes · Roadmap · Quiz · Flashcards
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

const VALID_SECTION_DIFFICULTY = new Set(["beginner", "intermediate", "advanced"]);
const VALID_DIFFICULTY         = new Set(["easy", "medium", "hard"]);
const VALID_IMPORTANCE         = new Set(["high", "medium", "low"]);
const VALID_FLASHCARD_TYPES    = new Set(["definition", "concept", "difference", "true_false", "code_recall", "scenario"]);

// ─── Notes Sections ────────────────────────────────────────────────────────────

export function safeSections(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((section, index) => ({
      title:     safeString(section.title)   || `Section ${index + 1}`,
      content:   safeString(section.content),
      type:      VALID_SECTION_TYPES.has(section.type)       ? section.type       : "core_concept",
      importance: VALID_IMPORTANCE.has(section.importance)   ? section.importance : "medium",
      difficulty: VALID_SECTION_DIFFICULTY.has(section.difficulty) ? section.difficulty : "beginner",
      nextTopic: safeString(section.nextTopic),
      order:     Number.isFinite(section.order) ? section.order : index,
    }))
    .filter((s) => s.content.length > 20)
    .sort((a, b) => a.order - b.order);
}

// ─── Flashcards ───────────────────────────────────────────────────────────────────────

export function safeFlashcards(value) {
  return safeArray(value)
    .filter(Boolean)
    .map((card, idx) => ({
      question:   safeString(card.question),
      answer:     safeString(card.answer),
      type:       VALID_FLASHCARD_TYPES.has(card.type) ? card.type : "concept",
      difficulty: VALID_DIFFICULTY.has(card.difficulty) ? card.difficulty : "easy",
      tags:       safeStringArray(card.tags).slice(0, 5),
    }))
    .filter((c) => c.question && c.answer)
    .slice(0, 200);
}

// ─── Knowledge Core ───────────────────────────────────────────────────────────────────

export function safeKnowledgeCore(value, sourceMeta = {}) {
  if (!value || typeof value !== "object") return null;

  const rawMeta = safeObject(value.metadata);

  const metadata = {
    schemaVersion:  safeString(rawMeta.schemaVersion) || "v1",
    aiVersion:      safeString(rawMeta.aiVersion)     || "v5",
    promptVersion:  safeString(rawMeta.promptVersion) || "v1",
    generatedAt:    rawMeta.generatedAt               || new Date(),
    domain:         safeString(rawMeta.domain)        || "general",
    level:          ["beginner", "intermediate", "advanced"].includes(rawMeta.level) ? rawMeta.level : "beginner",
    sourceType:     "youtube",
    sourceLanguage: safeString(sourceMeta.language)   || safeString(rawMeta.sourceLanguage) || "english",
    videoDuration:  Number.isFinite(sourceMeta.duration) ? sourceMeta.duration : (Number(rawMeta.videoDuration) || 0),
    videoId:        safeString(sourceMeta.videoId)    || safeString(rawMeta.videoId) || "",
    videoTitle:     safeString(sourceMeta.videoTitle) || safeString(rawMeta.videoTitle) || "",
  };

  const safeConfidence = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? Math.max(0, Math.min(1, num)) : 1.0;
  };

  const topics = safeArray(value.topics).map((t, i) => {
    if (typeof t === "string") return { id: `topic-${i + 1}`, name: t.trim() };
    return { id: safeString(t.id) || `topic-${i + 1}`, name: safeString(t.name || t.title) };
  }).filter((t) => t.name);

  const concepts = safeArray(value.concepts).map((c, i) => ({
    id:          safeString(c.id) || `concept-${i + 1}`,
    name:        safeString(c.name || c.title),
    explanation: safeString(c.explanation || c.content),
    importance:  VALID_IMPORTANCE.has(c.importance) ? c.importance : "medium",
    confidence:  safeConfidence(c.confidence),
  })).filter((c) => c.name);

  const definitions = safeArray(value.definitions).map((d, i) => ({
    id:         safeString(d.id) || `def-${i + 1}`,
    term:       safeString(d.term),
    definition: safeString(d.definition),
    confidence: safeConfidence(d.confidence),
  })).filter((d) => d.term && d.definition);

  const comparisons = safeArray(value.comparisons).map((comp, i) => ({
    id:         safeString(comp.id) || `comp-${i + 1}`,
    subjectA:   safeString(comp.subjectA),
    subjectB:   safeString(comp.subjectB),
    difference: safeString(comp.difference),
    confidence: safeConfidence(comp.confidence),
  })).filter((comp) => comp.subjectA && comp.subjectB);

  const relationships = safeArray(value.relationships).map((rel, i) => ({
    id:           safeString(rel.id) || `rel-${i + 1}`,
    sourceId:     safeString(rel.sourceId || rel.source),
    targetId:     safeString(rel.targetId || rel.target),
    relationship: safeString(rel.relationship || rel.type),
    confidence:   safeConfidence(rel.confidence),
  })).filter((rel) => rel.sourceId && rel.targetId);

  const formulas = safeArray(value.formulas).map((f, i) => ({
    id:          safeString(f.id) || `formula-${i + 1}`,
    name:        safeString(f.name),
    formula:     safeString(f.formula),
    explanation: safeString(f.explanation),
    confidence:  safeConfidence(f.confidence),
  })).filter((f) => f.formula);

  const glossary = safeArray(value.glossary).map((g, i) => ({
    id:         safeString(g.id) || `glossary-${i + 1}`,
    term:       safeString(g.term),
    definition: safeString(g.definition),
  })).filter((g) => g.term && g.definition);

  const timeline = safeArray(value.timeline).map((tm, i) => ({
    step:        tm.step ?? i + 1,
    title:       safeString(tm.title),
    description: safeString(tm.description),
  })).filter((tm) => tm.title || tm.description);

  return {
    metadata,
    topics,
    concepts,
    definitions,
    comparisons,
    prerequisites:     uniqueArray(safeStringArray(value.prerequisites)),
    commands:          uniqueArray(safeStringArray(value.commands)),
    formulas,
    glossary,
    relationships,
    realWorldExamples: uniqueArray(safeStringArray(value.realWorldExamples)),
    bestPractices:     uniqueArray(safeStringArray(value.bestPractices)),
    commonMistakes:    uniqueArray(safeStringArray(value.commonMistakes)),
    revisionPoints:    uniqueArray(safeStringArray(value.revisionPoints)),
    interviewInsights: uniqueArray(safeStringArray(value.interviewInsights)),
    timeline,
    references:        uniqueArray(safeStringArray(value.references)),
  };
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

export function normalizeOutput(data = {}, sourceMeta = {}) {
  const result = safeObject(data);

  return {
    contentType:        safeString(result.contentType).toLowerCase() || "general",
    summary:            safeString(result.summary),
    outcome:            safeString(result.outcome),
    learningObjectives: safeString(result.learningObjectives),
    notes:              safeString(result.notes),
    keyPoints:          uniqueArray(safeStringArray(result.keyPoints)),
    sections:           safeSections(result.sections),
    quiz:               safeQuiz(result.quiz),
    roadmap:            safeRoadmap(result.roadmap),
    learningPath:       safeLearningPath(result.learningPath),
    executionPlan:      safeExecutionPlan(result.executionPlan),
    flashcards:         safeFlashcards(result.flashcards),
    knowledgeCore:      safeKnowledgeCore(result.knowledgeCore, sourceMeta),
  };
}
