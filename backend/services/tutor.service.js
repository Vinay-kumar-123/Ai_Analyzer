/**
 * ============================================================================
 * AI Learning OS
 * AI Tutor Context & Retrieval Service — v1
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Implements the 4-level RAG context priority hierarchy:
 *   1. Knowledge Core (relevant concepts via access layer)
 *   2. Relevant Notes Sections
 *   3. Relevant Transcript Snippets (keyword/sentence search)
 *   4. OpenAI Context Assembly (with rolling token-based history cap)
 *
 * Streaming Ready:
 * Returns structured payload containing systemPrompt, contextString, and history
 * so that both standard JSON and future SSE Streaming handlers can consume it.
 * ============================================================================
 */

import {
  getConcepts,
  getDefinitions,
  getComparisons,
  getCommands,
  getInterviewInsights,
  getTopics,
} from "./knowledge/knowledgeCore.reader.js";

import { buildKnowledgeCoreFallback } from "./knowledge/knowledgeCore.builder.js";

// ─── RAG RETRIEVAL ENGINE ───────────────────────────────────────────────────

/**
 * Extracts relevant Knowledge Core primitives based on keyword matching against user question.
 */
function retrieveRelevantKnowledgeCore(knowledgeCore, query) {
  if (!knowledgeCore) return "";

  const q = query.toLowerCase();
  const concepts    = getConcepts(knowledgeCore);
  const definitions = getDefinitions(knowledgeCore);
  const comparisons = getComparisons(knowledgeCore);
  const commands    = getCommands(knowledgeCore);
  const insights    = getInterviewInsights(knowledgeCore);

  const matchedConcepts = concepts.filter(
    (c) => q.includes(c.name.toLowerCase()) || c.explanation.toLowerCase().includes(q)
  );

  const matchedDefs = definitions.filter(
    (d) => q.includes(d.term.toLowerCase()) || d.definition.toLowerCase().includes(q)
  );

  const matchedComps = comparisons.filter(
    (c) => q.includes(c.subjectA.toLowerCase()) || q.includes(c.subjectB.toLowerCase())
  );

  const items = [];

  if (matchedConcepts.length > 0) {
    items.push("RELEVANT CONCEPTS:\n" + matchedConcepts.map((c) => `• ${c.name}: ${c.explanation}`).join("\n"));
  }

  if (matchedDefs.length > 0) {
    items.push("RELEVANT DEFINITIONS:\n" + matchedDefs.map((d) => `• ${d.term}: ${d.definition}`).join("\n"));
  }

  if (matchedComps.length > 0) {
    items.push("RELEVANT COMPARISONS:\n" + matchedComps.map((c) => `• ${c.subjectA} vs ${c.subjectB}: ${c.difference}`).join("\n"));
  }

  if (items.length === 0 && (q.includes("command") || q.includes("terminal") || q.includes("code"))) {
    if (commands.length > 0) {
      items.push("COMMANDS:\n" + commands.slice(0, 10).join("\n"));
    }
  }

  return items.join("\n\n");
}

/**
 * Extracts matching Notes sections if Knowledge Core match was light.
 */
function retrieveRelevantSections(sections = [], query) {
  if (!Array.isArray(sections) || sections.length === 0) return "";

  const q = query.toLowerCase();
  const matched = sections.filter(
    (s) => (s.title && q.includes(s.title.toLowerCase())) || (s.content && s.content.toLowerCase().includes(q))
  );

  const targetSections = matched.length > 0 ? matched.slice(0, 2) : sections.slice(0, 2);

  return targetSections
    .map((s) => `TOPIC: ${s.title}\n${s.content.slice(0, 600)}`)
    .join("\n\n");
}

/**
 * Extracts relevant 2-3 sentence transcript snippets via keyword matching.
 * Capped strictly at ~400 tokens to avoid token bloat.
 */
function retrieveTranscriptSnippets(transcript = "", query) {
  if (!transcript || typeof transcript !== "string") return "";

  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return "";

  const sentences = transcript.split(/(?<=[.!?])\s+/);
  const matchedSentences = [];

  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();
    if (words.some((w) => sLower.includes(w))) {
      matchedSentences.push(sentence.trim());
      if (matchedSentences.length >= 4) break;
    }
  }

  return matchedSentences.join(" ");
}

/**
 * Cap history using a rolling token approximation (~4 chars per token).
 * Target max history tokens: 1,000 (~4,000 chars).
 */
export function pruneHistoryByTokens(history = [], maxChars = 4000) {
  if (!Array.isArray(history) || history.length === 0) return [];

  const pruned = [];
  let totalChars = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    const itemLen = (item.content || "").length;

    if (totalChars + itemLen > maxChars && pruned.length >= 2) {
      break;
    }

    pruned.unshift({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content || "",
    });
    totalChars += itemLen;
  }

  return pruned;
}

/**
 * Builds the complete, token-optimized RAG context string for the AI Tutor request.
 */
export function buildTutorRAGContext({
  analysis,
  question,
}) {
  if (!analysis) return "";

  const kc = analysis.knowledgeCore || buildKnowledgeCoreFallback(analysis);

  // Level 1: Knowledge Core Concept Retrieval
  let kcContext = retrieveRelevantKnowledgeCore(kc, question);

  // Level 2: Relevant Notes Sections
  let sectionsContext = retrieveRelevantSections(analysis.sections || [], question);

  // Level 3: Relevant Transcript Snippets (if query needs deeper text lookup)
  let snippetContext = "";
  if (!kcContext && !sectionsContext) {
    snippetContext = retrieveTranscriptSnippets(analysis.transcript || "", question);
  }

  const contextParts = [
    `VIDEO TITLE: ${analysis.videoTitle || "Untitled Video"}`,
    `STUDY GOAL: ${analysis.goal || "student"}`,
  ];

  if (kcContext) {
    contextParts.push(`=== KNOWLEDGE CORE RETRIEVAL ===\n${kcContext}`);
  }

  if (sectionsContext) {
    contextParts.push(`=== RELEVANT NOTES SECTIONS ===\n${sectionsContext}`);
  }

  if (snippetContext) {
    contextParts.push(`=== TRANSCRIPT SNIPPETS ===\n${snippetContext}`);
  }

  const fullContext = contextParts.join("\n\n");

  // Enforce explicit RAG Context character budget (max 3,500 chars / ~875 tokens)
  return fullContext.length > 3500 ? fullContext.slice(0, 3500) + "\n[Context Truncated]" : fullContext;
}

/**
 * OVERALL CONTEXT BUDGET MANAGER
 * Strictly caps the total combined payload (RAG Context + History + User Question)
 * at 6,000 characters (~1,500 tokens max input) before sending to OpenAI.
 */
export function enforceContextBudget({ ragContext, historyString, question }) {
  const MAX_TOTAL_CHARS = 6000;

  let safeRag = (ragContext || "").slice(0, 3500);
  let safeHist = (historyString || "").slice(0, 2000);
  let safeQ = (question || "").slice(0, 500);

  const combined = `=== LEARNING CONTEXT ===\n${safeRag}\n\n=== CONVERSATION HISTORY ===\n${safeHist}\n\n=== CURRENT STUDENT QUESTION ===\n${safeQ}`;

  if (combined.length > MAX_TOTAL_CHARS) {
    // Trim history first to fit inside budget
    const overage = combined.length - MAX_TOTAL_CHARS;
    safeHist = safeHist.slice(overage);
  }

  return `=== LEARNING CONTEXT ===\n${safeRag}\n\n=== CONVERSATION HISTORY ===\n${safeHist || "No previous history."}\n\n=== CURRENT STUDENT QUESTION ===\n${safeQ}`.trim();
}

export default {
  buildTutorRAGContext,
  pruneHistoryByTokens,
  enforceContextBudget,
};
