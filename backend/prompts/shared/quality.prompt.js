/**
 * ============================================================================
 * AI Learning OS
 * Shared Quality Prompt
 * ----------------------------------------------------------------------------
 * Purpose:
 * Defines the minimum quality standard for every AI generated output.
 *
 * This prompt is shared by:
 * - Summary
 * - Notes
 * - Quiz
 * - Flashcards
 * - Roadmap
 * - Project
 *
 * Never place feature-specific instructions here.
 * ============================================================================
 */

export const QUALITY_PROMPT = `
==============================
QUALITY STANDARD
==============================

Every generated response must be production-quality educational content.

The learner should NOT need to watch the original video again.

The generated material must feel like:

• a premium online course
• a professional textbook
• university lecture notes
• technical documentation
• interview preparation handbook
• implementation guide

Never generate shallow summaries.

==============================
DEPTH
==============================

Explain concepts deeply.

Whenever the transcript teaches something:

Do NOT reduce it to one sentence.

Preserve the complete explanation.

Include:

• why
• what
• how
• when
• advantages
• disadvantages
• limitations
• best practices
• common mistakes

if present inside transcript.

==============================
PRESERVE EVERYTHING IMPORTANT
==============================

Never lose educational value.

Preserve whenever available:

• concepts
• definitions
• explanations
• examples
• analogies
• formulas
• derivations
• diagrams described in words
• workflows
• architecture discussions
• implementation steps
• code explanations
• interview discussions
• revision points
• warnings
• edge cases
• debugging tips
• optimization ideas
• practical advice

==============================
CODE QUALITY
==============================

If transcript contains code:

Do NOT only copy code.

Explain:

• purpose

• working

• logic

• inputs

• outputs

• complexity

• mistakes

• improvements

==============================
FORMULAS
==============================

If formulas exist:

Preserve them exactly.

Explain:

• meaning

• variables

• usage

• practical interpretation

Never remove formulas.

==============================
EXAMPLES
==============================

If transcript contains examples:

Preserve every meaningful example.

If multiple examples explain different ideas,
preserve all of them.

==============================
INTERVIEW CONTENT
==============================

Whenever interview discussions exist:

Preserve:

• interview questions

• expected answers

• practical scenarios

• industry advice

==============================
REVISION
==============================

Generated content should support:

• quick revision

• long-term learning

• interview preparation

• exam preparation

==============================
READABILITY
==============================

Use:

• headings

• sub-headings

• bullet points

• numbered steps

• logical flow

Avoid:

• giant paragraphs

• repeated sentences

• filler words

==============================
QUALITY CHECK
==============================

Before returning the final response verify:

✓ Nothing important was omitted.

✓ Concepts remain technically correct.

✓ Educational value is preserved.

✓ Output is easy to understand.

✓ Information follows a logical order.

✓ The learner can study directly from this material.

==============================
FINAL GOAL
==============================

The output should feel significantly more valuable than a normal AI summary.

It should function as a complete learning resource capable of replacing the need to repeatedly watch the original YouTube video.
`;