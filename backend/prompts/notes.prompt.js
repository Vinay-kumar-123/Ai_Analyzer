/**
 * ============================================================================
 * AI Learning OS
 * Premium Notes Prompt
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate complete educational notes from transcript.
 *
 * Used ONLY by:
 * notes.generator.js
 *
 * Generates:
 * - notes
 * - sections
 *
 * ============================================================================
 */

import { buildPrompt } from "./builders/prompt.builder.js";

const NOTES_FEATURE_PROMPT = `
==================================================
MISSION
==================================================

Generate PREMIUM COURSE NOTES.

The learner should NEVER need to watch the original
YouTube video again.

The notes must feel like:

• Premium textbook
• University lecture notes
• Professional documentation
• Technical handbook
• Complete learning resource

==================================================
GOAL
==================================================

Do NOT summarize.

Transform the transcript into a complete study book.

Assume the transcript will be deleted after generation.

Everything important must remain inside the notes.

==================================================
ORGANIZATION
==================================================

Convert the transcript into chapters.

Every chapter should contain:

• title

• explanation

• important concepts

• examples

• practical discussion

• conclusion

Arrange information logically.

Never preserve transcript order if it hurts readability.

==================================================
EXPLANATION STYLE
==================================================

Explain every important concept.

Whenever something is introduced explain:

• What is it?

• Why is it important?

• How does it work?

• When should it be used?

• Advantages

• Disadvantages

• Limitations

• Best practices

• Common mistakes

• Real-world usage

==================================================
CODE
==================================================

Whenever code appears:

Do NOT simply include code.

Explain:

• purpose

• architecture

• logic

• workflow

• line-by-line reasoning when needed

• optimization ideas

• debugging advice

==================================================
FORMULAS
==================================================

If formulas exist:

Preserve exactly.

Explain:

• variables

• meaning

• practical usage

• derivation if discussed

==================================================
EXAMPLES
==================================================

Preserve all meaningful examples.

Expand examples when necessary for clarity.

==================================================
WORKFLOWS
==================================================

Whenever the transcript teaches a process:

Convert it into:

Step 1

Step 2

Step 3

...

Never compress workflows.

==================================================
INTERVIEW INSIGHTS
==================================================

If interview discussion exists:

Preserve:

• interview questions

• expected answers

• interviewer mindset

• practical advice

==================================================
REVISION
==================================================

At the end of each major section include:

• key takeaways

• quick revision

• important reminders

==================================================
SECTION TYPES
==================================================

Allowed values only:

introduction

core_concept

example

advanced

interview

revision

warning

summary

code

project

==================================================
SECTION QUALITY
==================================================

Each section must contain enough detail to teach
the topic independently.

Avoid tiny sections.

Avoid one-line explanations.

Every section should feel like a chapter of a book.

==================================================
OUTPUT JSON
==================================================

Return ONLY:

{
  "notes": "",
  "sections": [
    {
      "title": "",
      "content": "",
      "type": "",
      "importance": "high",
      "order": 0
    }
  ]
}

Do not return any additional fields.
`;

export function getNotesPrompt({
  goal = "student",
  language = "english",
} = {}) {
  return buildPrompt({
    featurePrompt: NOTES_FEATURE_PROMPT,
    goal,
    language,
  });
}