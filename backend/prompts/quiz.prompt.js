/**
 * ============================================================================
 * AI Learning OS
 * Quiz Prompt
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate transcript-grounded quizzes and interview Q&A.
 *
 * Used ONLY by:
 * quiz.generator.js
 *
 * Generates:
 * - quiz
 * - qa
 * ============================================================================
 */

import { buildPrompt } from "./builders/prompt.builder.js";

const QUIZ_FEATURE_PROMPT = `
==================================================
MISSION
==================================================

Generate a PREMIUM learning assessment.

The quiz must measure whether the learner actually
understood the transcript.

Do NOT create random questions.

Every question MUST come from the transcript.

==================================================
GOAL
==================================================

Create questions that help learners:

• revise
• remember
• self-test
• prepare for interviews
• prepare for exams

Questions should encourage understanding,
not memorization only.

==================================================
QUIZ RULES
==================================================

Generate between 10 and 20 questions.

Every question MUST contain exactly 4 options.

Exactly ONE option must be correct.

Do NOT create duplicate questions.

Cover the entire transcript.

==================================================
QUESTION TYPES
==================================================

Mix different question styles.

Include:

• Conceptual
• Practical
• Scenario Based
• Code Based (if applicable)
• Formula Based (if applicable)
• Interview Style (if applicable)
• Revision Questions

==================================================
OPTIONS
==================================================

Wrong options should look believable.

Avoid obviously wrong answers.

Avoid joke answers.

==================================================
CORRECT ANSWER
==================================================

Return ONLY:

correctAnswerIndex

Allowed values:

0
1
2
3

Never return:

correctAnswer

Never return option text.

Never return letters:

A
B
C
D

Only integer index.

==================================================
EXPLANATION
==================================================

Every question MUST include:

explanation

Explain:

• why correct

• why others are wrong when useful

==================================================
DIFFICULTY
==================================================

Allowed:

easy

medium

hard

Mix all three levels.

==================================================
QUALITY
==================================================

Questions must be:

• transcript grounded
• technically correct
• educational
• practical
• non repetitive

==================================================
Q&A
==================================================

Generate between 10 and 20 important Q&A.

Every Q&A must contain:

question

answer

Use Q&A suitable for:

• interview
• revision
• viva
• self learning

==================================================
OUTPUT JSON
==================================================

Return ONLY:

{
  "quiz": [
    {
      "question": "",
      "options": [
        "",
        "",
        "",
        ""
      ],
      "correctAnswerIndex": 0,
      "explanation": "",
      "difficulty": "medium"
    }
  ],
  "qa": [
    {
      "question": "",
      "answer": ""
    }
  ]
}

Do not return any additional fields.
`;

export function getQuizPrompt({
  goal = "student",
  language = "english",
} = {}) {
  return buildPrompt({
    featurePrompt: QUIZ_FEATURE_PROMPT,
    goal,
    language,
  });
}