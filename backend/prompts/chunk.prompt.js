/**
 * ============================================================================
 * AI Learning OS
 * Chunk Prompt — v2 (Phase 1A)
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Extract structured learning memory from ONE transcript chunk.
 *
 * Used ONLY by:
 * chunk.generator.js
 *
 * Generates intermediate memory — NOT final notes.
 * ============================================================================
 */

import { buildPrompt } from "./builders/prompt.builder.js";

const CHUNK_FEATURE_PROMPT = `
==================================================
MISSION
==================================================

Your job is NOT to summarize the transcript.

Your job is to extract every piece of educational value from this chunk
so that the final notes can be created without re-reading the transcript.

Prioritize understanding over compression.

==================================================
INSTRUCTOR VOICE
==================================================

Preserve the instructor's unique explanations, intuitions, and reasoning.

Do NOT replace the instructor's explanation with a generic textbook version.

If the instructor explains something in an unusual or memorable way, preserve
that exact framing — it is often more educational than a standard definition.

If the instructor uses an analogy, metaphor, or comparison, extract it exactly
as they expressed it. Do NOT paraphrase it into a generic form.

==================================================
CONFIDENCE RULE
==================================================

Only extract what the instructor explicitly stated in this chunk.

If the evidence is insufficient, do NOT infer or speculate.

Prefer omission over speculation.

An empty array [] is correct output when the chunk contains nothing relevant
for a field. Never fabricate content to fill a field.

Only include EXPLICIT content — things the instructor directly stated.
If you are inferring from context, skip the item.

==================================================
CONCEPTS
==================================================

Extract every concept the instructor explicitly introduces or explains.

Format each as a single string:
  [Concept Name] — [one-sentence definition in the instructor's own words]

Example:
  "Closure — a function that retains access to its outer scope's variables
   even after the outer function has returned."

Rules:
- Use the instructor's explanation, not a standard textbook definition.
- Only extract concepts the instructor explicitly introduces in this chunk.
- Do NOT extract vague category words like "important" or "useful."
- Do NOT extract the same concept twice with different wording.
- If no concepts are introduced, return [].

==================================================
KEY POINTS
==================================================

Extract the facts the student must remember one week from now.

Rules:
- Every key point must be a complete, standalone sentence.
  A student must understand it with zero surrounding context.
- Prefer causal statements: "X happens because Y" beats "X is important."
- Only include facts the instructor emphasizes — signals include:
  "always", "never", "remember that", "the key thing is", "this is critical",
  "the important thing to understand", "don't forget".
- Aim for 3 to 8 key points. Do not pad to reach 8. Do not truncate genuine insights.

==================================================
INSTRUCTOR EXAMPLES
==================================================

Extract every example the instructor gives to illustrate a concept.

Format each as a single string:
  "Context: [which concept this example illustrates] | Instructor Example: [the specific example the instructor gave]"

If the instructor mentions real-world or production usage:
  "Context: Real-world — [where/how this is used] | Instructor Example: [the specific real-world application the instructor described]"

Rules:
- Only examples the instructor explicitly gives. Do NOT invent or generalize.
- Do NOT expand or embellish the instructor's example beyond what was said.
- If no examples exist in this chunk, return [].

==================================================
CODE
==================================================

If the instructor demonstrates or explains code:

Extract into codeSnippets[] as a single string per snippet:
  "Code: [the exact code] | Purpose: [in the instructor's words] | Key logic: [what the instructor explained] | Watch out: [any error the instructor warns about]"

Rules:
- Do NOT invent code not shown or described in this chunk.
- Do NOT add explanations the instructor did not give.
- If no code exists, return [].

==================================================
FORMULAS
==================================================

Preserve every formula exactly as the instructor states it.

Format each as a single string:
  "Formula: [expression] | Variables: [what each means] | When to use: [the instructor's guidance]"

Never rewrite or simplify mathematical expressions.
If no formulas exist, return [].

==================================================
WARNINGS
==================================================

If the instructor explicitly warns against something or describes a failure scenario:

Format each as a single string:
  "⚠ [The specific warning] → [What goes wrong if this is ignored]"

Example:
  "⚠ Never mutate state directly in React → bypasses reconciliation,
   causing silent bugs that are nearly impossible to trace."

Rules:
- Only extract warnings the instructor explicitly states.
- Do NOT infer warnings from general best-practice knowledge.
- The consequence must come from what the instructor describes — do NOT add your own.
- If no warnings exist in this chunk, return [].

==================================================
INTERVIEW INSIGHTS
==================================================

If the instructor explicitly discusses interview questions, job applications,
or hiring advice in this chunk:

Format for Q&A:
  "Q: [the interview question] | A: [the expected answer in 2–4 sentences]"

Format for advice without a question:
  "Insight: [the advice — one complete sentence from the instructor]"

Rules:
- Only extract from explicit instructor interview discussion.
- Do NOT fabricate interview questions based on the topic name.
- If no interview content exists in this chunk, return [].

==================================================
REVISION POINTS
==================================================

Extract 2 to 5 insights that CONNECT ideas — not just state facts.

Good: "X is preferred over Y when Z because it avoids W."
Bad:  "X is important."

Rules:
- Each revision point must connect at least two ideas from this chunk.
- Do NOT copy keyPoints[] verbatim. These must be distinct synthesis statements.
- Return fewer entries rather than padding with weak insights.
- Ask: "Would a student who understands this be better prepared for an
  interview or a real project?" If yes, include it. If no, skip it.
- If fewer than 2 genuine synthesis insights exist, return 1 or even 0.

==================================================
NOTES
==================================================

For each major topic discussed in this chunk, write a mini-explanation block:

**[Topic Name]**
Why this matters: [why the instructor says a student needs to know this —
                  what problem it solves, what it enables, what breaks without it.
                  OMIT this line if the instructor does not explain relevance.]
What: [what the instructor says this is — in their own words, not a textbook definition]
How: [how it works or is used — OMIT if not discussed in this chunk]
Instructor Example: [the specific example the instructor gave — OMIT if none given]

Rules:
- Preserve the instructor's framing and reasoning exactly.
  Do NOT replace it with a textbook version.
- Do NOT use markdown heading levels (# or ##). Use only bold labels.
- Do NOT summarize. Write at the same depth the instructor used.
- Connect topics if the instructor connects them — preserve that relationship.

==================================================
OUTPUT JSON
==================================================

Return ONLY:

{
  "concepts": [],
  "keyPoints": [],
  "notes": "",
  "examples": [],
  "codeSnippets": [],
  "warnings": [],
  "formulas": [],
  "revisionPoints": [],
  "interviewInsights": []
}

Do not return any additional fields.
`;

export function getChunkPrompt({
  goal = "student",
  language = "english",
} = {}) {
  return buildPrompt({
    featurePrompt: CHUNK_FEATURE_PROMPT,
    goal,
    language,
  });
}