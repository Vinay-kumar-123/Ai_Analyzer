/**
 * ============================================================================
 * AI Learning OS
 * Summary Prompt
 * ----------------------------------------------------------------------------
 * Initial analysis prompt.
 *
 * Used ONLY during first analysis.
 *
 * Generates:
 * - contentType
 * - summary
 * - outcome
 * - keyPoints
 *
 * Does NOT generate:
 * - notes
 * - sections
 * - quiz
 * - flashcards
 * - project
 * - roadmap
 *
 * Those are generated lazily.
 * ============================================================================
 */

import { buildPrompt } from "./builders/prompt.builder.js";

const SUMMARY_FEATURE_PROMPT = `
==================================================
INITIAL ANALYSIS
==================================================

This is the FIRST analysis of the transcript.

Your goal is to produce only lightweight metadata.

Generate ONLY:

• contentType
• summary
• outcome
• keyPoints

Do NOT generate:

• notes
• sections
• quiz
• flashcards
• roadmap
• project
• executionPlan
• actionEngine
• confusion
• qa

==================================================
SUMMARY
==================================================

Write a complete but concise overview.

The learner should immediately understand:

• what the video is about

• who should watch it

• what will be learned

• important ideas

Do not write a one-line summary.

Do not copy transcript sentences.

==================================================
KEY POINTS
==================================================

Extract the most valuable learning points.

Requirements:

• transcript grounded

• non-repetitive

• educational

• practical

Maximum:

30 key points.

==================================================
OUTCOME
==================================================

Explain what the learner will be able to do
after studying the generated learning materials.

==================================================
CONTENT TYPE
==================================================

Return ONLY one value.

Allowed:

tech

academic

general

interview

==================================================
OUTPUT JSON
==================================================

Return exactly:

{
  "contentType": "",
  "summary": "",
  "outcome": "",
  "keyPoints": []
}

Do not return any additional fields.
`;

export function getSummaryPrompt({
  goal = "student",
  language = "english",
} = {}) {
  return buildPrompt({
    featurePrompt: SUMMARY_FEATURE_PROMPT,
    goal,
    language,
  });
}