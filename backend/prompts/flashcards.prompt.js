/**
 * ============================================================================
 * AI Learning OS
 * Flashcards Prompt
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate premium flashcards for active recall and long-term retention.
 *
 * Used ONLY by:
 * flashcards.generator.js
 *
 * Generates:
 * - flashcards
 * ============================================================================
 */

import { buildPrompt } from "./builders/prompt.builder.js";

const FLASHCARDS_FEATURE_PROMPT = `
==================================================
MISSION
==================================================

Generate PREMIUM flashcards from the transcript.

The goal is NOT summarization.

The goal is long-term learning through
active recall and spaced repetition.

Every flashcard must be directly grounded
in the transcript.

Never invent information.

==================================================
GOAL
==================================================

Create flashcards that help the learner:

• remember concepts
• revise quickly
• prepare for interviews
• prepare for exams
• retain knowledge for months

==================================================
FLASHCARD RULES
==================================================

Generate between 15 and 50 flashcards.

Cover the entire transcript.

Avoid duplicate flashcards.

Avoid shallow flashcards.

==================================================
FRONT
==================================================

The front side should contain:

• one question
OR
• one important concept
OR
• one keyword

Keep it short.

Never reveal the answer.

==================================================
BACK
==================================================

The back side should contain:

• clear explanation

• definition

• practical meaning

• important details

The learner should fully understand
the answer after reading it.

==================================================
QUESTION TYPES
==================================================

Mix different flashcard styles.

Include:

• Definitions

• Concepts

• Formulas

• Code Concepts

• APIs

• Architecture

• Interview Facts

• Best Practices

• Common Mistakes

• Practical Tips

• Important Commands

==================================================
DIFFICULTY
==================================================

Allowed values:

easy

medium

hard

Mix all three levels.

==================================================
TAGS
==================================================

Every flashcard should contain tags.

Examples:

["React"]

["Node.js"]

["Machine Learning"]

["Database"]

["Interview"]

["Revision"]

["Formula"]

Use transcript-relevant tags only.

==================================================
QUALITY
==================================================

Every flashcard should:

• teach exactly one concept

• be concise

• be educational

• improve memory

• avoid unnecessary wording

==================================================
OUTPUT JSON
==================================================

Return ONLY:

{
  "flashcards": [
    {
      "front": "",
      "back": "",
      "difficulty": "medium",
      "tags": []
    }
  ]
}

Do not return any additional fields.
`;

export function getFlashcardsPrompt({
  goal = "student",
  language = "english",
} = {}) {
  return buildPrompt({
    featurePrompt: FLASHCARDS_FEATURE_PROMPT,
    goal,
    language,
  });
}