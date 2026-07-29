/**
 * ============================================================================
 * AI Learning OS
 * Synthesis Prompt — v3 (Phase 1A)
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Convert merged learning memory into structured, per-topic educational notes.
 *
 * Used ONLY by:
 * synthesis.generator.js
 *
 * Input:
 * Memory object from memory.builder.js
 *
 * Output:
 * - learningObjectives  (string — markdown bullet list)
 * - notes               (string — full markdown overview document)
 * - masterNotes         (object — complete educational knowledge base)
 * - sections            (array  — one entry per major topic)
 * - knowledgeCore       (object — structured knowledge graph)
 *
 * ============================================================================
 */

import { buildPrompt } from "./builders/prompt.builder.js";

const SYNTHESIS_FEATURE_PROMPT = `
==================================================
MISSION
==================================================

Your job is NOT to summarize the transcript.

Your job is to create the highest-quality study material possible
while remaining completely faithful to the transcript.

Prioritize understanding over compression.

You are transforming extracted learning memory into a complete educational document
that replaces the need to re-watch the video.

==================================================
INSTRUCTOR VOICE
==================================================

Preserve the instructor's unique explanations, intuitions, and reasoning.

Do NOT replace the instructor's explanation with generic textbook content.

If the instructor explains something in an unusual or memorable way, preserve that
exact framing in the explanation and content fields. It is often more educational
than the standard textbook definition.

If the memory contains an analogy or metaphor the instructor used, preserve it
exactly. Do NOT paraphrase or substitute a different analogy.

The student should feel they are reading the instructor's own organized notes,
not a generic AI summary of a topic.

==================================================
CONFIDENCE RULE
==================================================

Your authority is the memory object. The memory IS your transcript.
You have no other source of truth.

If the memory signal for a field is insufficient, do NOT infer or speculate.
Prefer omission over speculation.

An empty array [] is correct and honest output when no relevant signal exists.
Never fabricate content to fill a field.

Grounding test — before including any fact, ask:
  "Is this explicitly in the memory object?"
  Yes → include it.
  No  → omit it, even if you know it to be true from your training data.

==================================================
LEARNING OBJECTIVES
==================================================

Generate 3 to 6 learning objectives using Bloom's Taxonomy action verbs.

Verb selection — choose the tier that matches how deeply the instructor teaches:

  Remember tier    → Define, List, Recall, Name, Identify
  Understand tier  → Explain, Describe, Summarize, Classify, Interpret
  Apply tier       → Use, Implement, Execute, Build, Demonstrate
  Analyze tier     → Differentiate, Compare, Break down, Examine, Distinguish

Rules:
- Never use "Understand" as a verb — it is unmeasurable. Use a specific verb.
- Each objective must reference a specific concept from the memory.
- At least one objective must be at Apply tier or higher if the content supports it.
- Do NOT write objectives for topics absent from the memory.

Format for the top-level "learningObjectives" string:
  After studying these notes, you will be able to:
  - [Bloom's verb] [specific outcome] (Difficulty: beginner | intermediate | advanced)

Good: "Implement a closure to preserve state across function calls (Difficulty: intermediate)"
Bad:  "Understand closures"

Populate BOTH the top-level "learningObjectives" string AND
the "masterNotes.learningObjectives" array with these objectives.

==================================================
WHY THIS MATTERS — GLOBAL RULE
==================================================

For every section generated, be able to answer:
"Why does a student preparing for an interview, building a project,
 or studying for an exam need to know this topic?"

If the answer is clear from the memory → write it in ## Why This Matters.
If the answer is not clear from the memory → OMIT the sub-section entirely.

Never invent relevance. Relevance not grounded in the instructor's own words
is a form of hallucination.

==================================================
SECTIONS
==================================================

Create one section per major topic covered in the memory.
Do NOT create more sections than the memory actually covers.

Assign importance using the 80/20 principle:
  "high"   — critical 20% that explains 80% of the video's value
  "medium" — important but not foundational
  "low"    — supplementary depth

No more than 40% of sections should be "high."
Base importance on how many memory signals reference this topic.

Each section MUST follow this exact content template inside the "content" field:

---

# [Topic Name]

[Opening: 1 to 3 sentences in the instructor's own words.
 Teach the concept — do NOT start with "In this section..." or "This covers..."
 Use the instructor's framing and reasoning, not a generic textbook introduction.]

## Why This Matters

[1 to 2 sentences: why the instructor says a student needs to know this.
 What problem does it solve? What does it enable? What breaks without it?
 Ground this in what the instructor explicitly said.
 OMIT entirely if the memory provides no "why" signal for this topic.]

## Key Concepts

[One bullet per distinct concept from the memory for this topic.
 Format: **[Concept Name]** — [definition in the instructor's words]
 Minimum 2 bullets. Do NOT list synonyms as separate bullets.
 Every bullet must come from the memory's concepts[] for this topic.]

## Important Points

[Standalone complete sentences the student must remember.
 Minimum 3 bullets. Maximum 7 bullets — prioritize ruthlessly.
 Prefer causal statements: "X works because Y."
 Do NOT restate Key Concepts verbatim — these must be distinct facts.
 Every point must come from the memory's keyPoints[] for this topic.]

## Real-world Applications

[1 to 3 bullets showing where this concept is used in production or real jobs.
 Format: "In [context], this is used to [specific application]."
 Draw ONLY from memory entries with "Real-world" prefix in examples[].
 OMIT entirely if the memory contains no real-world signal for this topic.]

## Best Practices

[Bullet list beginning with action verbs: "Use...", "Avoid...", "Always...", "Never..."
 Draw from the memory's revisionPoints[] and keyPoints[] best-practice signals.
 Preserve the instructor's recommended approaches exactly.
 OMIT entirely if the memory provides no best-practice signal for this topic.]

## Common Mistakes

[Format: ✗ [what beginners incorrectly do] → ✓ [what should be done instead]
 Draw ONLY from the memory's warnings[] for this topic.
 The correction must reflect what the instructor recommended.
 OMIT entirely if the memory's warnings[] contains nothing for this topic.]

## Visual Analogy

[If the memory contains an analogy or metaphor the instructor used for this topic:
 "[Concept] is like [instructor's analogy]. [One sentence: why this captures the key insight.]"
 Preserve the instructor's exact framing — do NOT substitute a different analogy.
 OMIT entirely if the memory contains no analogy for this topic.
 Never invent an analogy the instructor did not use.]

## Instructor Examples

[Preserve every example from the memory for this topic.
 Format: "Instructor Example: [the example exactly as the instructor gave it]"
 Do NOT expand, generalize, or alter the instructor's examples.
 OMIT entirely if no examples exist for this topic in the memory.]

## Code Example

[Include a fenced code block ONLY if the memory's codeSnippets[] contains code
 for this topic. Use the exact language identifier.
 After the code block: 2 to 3 sentences explaining purpose and key logic
 in the instructor's own words.
 OMIT entirely if codeSnippets[] is empty for this topic.
 NEVER generate code not present in the memory.]

## Quick Revision — 80/20

[EXACTLY 5 bullets. These 5 bullets must deliver 80% of the learning value of this section.
 Choose ruthlessly — every bullet must earn its place.

 Format with audience prefix:
 [B] [foundational fact a beginner MUST know]
 [B] [second foundational fact]
 [I] [synthesis insight connecting two concepts from this topic]
 [I] [application or practical insight from the memory]
 [A] [production caveat, edge case, or optimization — MUST come from the memory]

 Rules:
 - The [A] bullet must be grounded in the memory. Do NOT add advanced caveats
   from your training knowledge.
 - Do NOT repeat Key Concepts verbatim. Synthesis and application only.
 - The [I] and [A] bullets must be more complex than the [B] bullets.]

## Interview Relevance

[If the memory's interviewInsights[] contains content for this topic:
 Format: "Q: [question] — A: [2–4 sentence answer from the memory]"
 Then add: "Key signal: [1–2 facts the interviewer listens for]"
 OMIT entirely if the memory contains no interview content for this topic.
 Never fabricate questions or answers.]

---

==================================================
DIFFICULTY LEVELS
==================================================

For each section, assign a difficulty level based on how the instructor presents it:

beginner     — foundational, no prior knowledge needed
intermediate — requires basic understanding of the field
advanced     — requires prior experience or deep technical knowledge

Do not assign "advanced" unnecessarily.
Infer difficulty only from how the instructor teaches the topic.

Return the value as the "difficulty" field on each section object.

==================================================
NEXT TOPIC CONNECTOR
==================================================

For each section, if another logical topic follows in the memory,
set the "nextTopic" field to the title of that next section.

If there is no logical continuation, set "nextTopic" to "".

NEVER fabricate a next topic that does not appear in the memory.

==================================================
MASTER NOTES FIELDS
==================================================

masterNotes.title
-----------------
The full topic title of the video. Derived from the memory's overall subject.

masterNotes.overview
--------------------
2 to 3 sentences orienting the student: what this video teaches and why it matters.
Ground this in the memory's overall topic coverage.
This is NOT a summary — it is a navigation statement for the student.

masterNotes.learningObjectives[]
---------------------------------
Array mirror of the top-level learningObjectives string.
One string per objective, using the same Bloom's Taxonomy format.
Downstream generators consume this array — keep it exactly consistent
with the top-level string.

---

modules[].explanation
---------------------
Write the main educational body for this module.
Preserve the instructor's own explanations and reasoning.
Do NOT replace with generic textbook content.

Minimum structure by module type:
  "core_concept": 3 paragraphs — What it is + How it works + When/Decision context
  "introduction": 2 paragraphs — What it is + Why it matters
  "example":      1 paragraph  — sufficient
  "advanced":     3 paragraphs — Mechanism + Edge cases + Production context
  other types:    2 paragraphs minimum

Rules:
- Write prose paragraphs, not only bullet points.
- Do NOT start with "In this section..." — start with the concept itself.
- Every paragraph must be grounded in the memory for this module.
- Use the instructor's reasoning and sequence, not a generic explanation.

modules[].concepts[]
-------------------
Format: "[Concept Name] — [definition in the instructor's words]"
Minimum 1 entry per module. Draw from memory.concepts[] for this topic.

modules[].importantPoints[]
----------------------------
Standalone complete-sentence facts from memory.keyPoints[] for this module.
Minimum 3. Maximum 7. Prefer causal statements.

modules[].examples[]
--------------------
Format: "Context: [concept] | Instructor Example: [instructor's example]"
Real-world: "Context: Real-world — [where/how] | Instructor Example: [description]"
Do NOT invent examples. If the memory contains none, return [].

modules[].analogies[]
---------------------
If the memory contains comparisons between two things the instructor drew:
Preserve the instructor's comparison exactly.
Do NOT invent comparisons not in the memory.

modules[].codeExamples[]
------------------------
Only if memory.codeSnippets[] contains code for this module.
Include code, purpose, key logic, and any errors — all in the instructor's words.
If no code in memory, return [].

modules[].formulas[]
--------------------
Preserve from memory.formulas[] for this module: name, expression, variables, usage.
If no formulas in memory, return [].

modules[].keywords[]
---------------------
Every technical term introduced in this module.
The module's vocabulary index. Draw from memory.concepts[] names.

modules[].interviewQuestions[]
------------------------------
Only if memory.interviewInsights[] contains content for this module.
Format: "Q: [question] | A: [complete answer 2–4 sentences] | Signal: [1–2 key points]"
Maximum 5 entries. If no interview signal, return [].

modules[].examNotes[]
----------------------
For ACADEMIC content: exam-critical facts, theorems, derivations from the memory.
For TECH/GENERAL content: return [].

modules[].commonMistakes[]
---------------------------
Only from memory.warnings[] for this module.
Format: "✗ [what beginners incorrectly do] → ✓ [what to do instead]"
If no warning signal, return [].

modules[].memoryTricks[]
------------------------
Only if memory contains an analogy or metaphor the instructor used.
Format: "[Concept] is like [instructor's analogy]. [Why this captures the key insight.]"
Prioritize visual or spatial analogies. Preserve the instructor's exact framing.
Maximum 3 entries. If no analogy signal, return [].

modules[].practiceQuestions[]
------------------------------
2 to 4 self-testing questions answerable from this module's content alone.
Format: "[Practice question]"
These seed the Quiz generator — they are not final quiz questions.

modules[].quickRevision[]
--------------------------
EXACTLY 5 bullets using the 80/20 principle.
Format: "[B] [beginner] / [B] [beginner] / [I] [intermediate] / [I] [intermediate] / [A] [advanced]"
All 5 must be grounded in the memory. The [A] bullet must not use training knowledge.

---

masterNotes.glossary[]
-----------------------
One entry per technical term introduced anywhere in the video.
Use the instructor's definition from the memory's concepts[].

masterNotes.cheatSheet[]
------------------------
80/20 global memory jog: a student reading this in 2 minutes recalls 80% of the video.
One entry per major topic.
Format: "[Topic Title]: [The single most important sentence about this topic]"
The sentence must be self-contained, memorable, and causal or contrast in structure.
Maximum 20 entries. Base each on the module's importantPoints[].
Do NOT reuse sentences from importantTakeaways[].

masterNotes.finalRevision[]
----------------------------
5 to 8 statements synthesizing how the video's topics CONNECT to each other.
These are relationship statements, not individual facts.

Required patterns:
  "Understanding [Topic A] is essential before [Topic B] makes sense, because..."
  "[Topic A concept] and [Topic B concept] work together to solve [problem]."
  "The progression from [early topic] to [later topic] reveals [key insight]."

Rules:
- Every statement must reference at least 2 different modules.
- Do NOT repeat any statement from any module's quickRevision[].
- Do NOT state individual definitions or facts.
- Draw ONLY from the modules that were generated.

masterNotes.importantTakeaways[]
---------------------------------
Exactly 7 insights from the entire video responsible for 80% of the educational value.
Prefer synthesis: "X and Y together explain Z" beats "X exists."
Ground every takeaway in memory.keyPoints[] or memory.revisionPoints[].
Do NOT repeat sentences from finalRevision[] verbatim.

==================================================
NOTES TOP-LEVEL FIELD
==================================================

Generate a navigable overview document.
Do NOT copy sections[].content here — they serve different reading modes.

Structure:
1. Learning Objectives block (copy from learningObjectives field)
2. For each major topic: one paragraph (3–5 sentences) introducing the topic,
   its relevance, and how it connects to adjacent topics.
3. Final paragraph: one paragraph connecting all topics together.

Rules:
- Maximum 800 words. Do NOT exceed this limit.
- Every paragraph must be grounded in the memory.
- Preserve the instructor's sequence and reasoning.
- A student reading only the notes should understand the video's overall arc.

==================================================
KNOWLEDGE CORE METADATA
==================================================

knowledgeCore.metadata.domain
  Choose from: tech | academic | general | interview
  Base on the memory's overall content type.

knowledgeCore.metadata.level
  Choose from: beginner | intermediate | advanced
  Base on the difficulty of the most complex topics in the memory.
  If mixed, choose intermediate.
  Do NOT assign advanced unless the memory clearly requires prior expertise.

These two fields are used by downstream generators to calibrate their output.
Set them accurately.

==================================================
HALLUCINATION PREVENTION
==================================================

Your authority is the memory object. You have no other source of truth.

NEVER:
- Create a module for a topic absent from memory.concepts[], memory.keyPoints[],
  or memory.notes
- Include code in codeExamples[] or any Code Example section unless it appears
  in memory.codeSnippets[]
- Populate interviewQuestions[] unless memory.interviewInsights[] contains
  content for that specific module
- Add an analogy to memoryTricks[] or Visual Analogy sections unless it appears
  in memory.notes or memory.examples
- Write a ✗ entry in commonMistakes[] unless it appears in memory.warnings[]
- Add a formula unless it appears in memory.formulas[]
- Write a Real-world Applications bullet unless it appears in memory.examples[]
  with a "Real-world" prefix
- Write a "Why This Matters" sub-section unless the memory provides a relevance signal
- Assign "high" importance to more than 40% of sections

ALWAYS:
- Return [] when the memory contains no relevant signal for a field
- OMIT any section sub-section when the memory provides no signal for it
- Use "The instructor implies..." for anything inferred — never state inferences as facts
- Treat [] as correct, honest output — not a failure

==================================================
FORMATTING RULES
==================================================

Use proper markdown inside all "content" and "notes" string fields.

Use:
- # for topic title
- ## for sub-section headings
- - for bullet lists
- triple backtick + language for code blocks (e.g. \`\`\`python)
- single backtick for inline code references
- **bold** for concept names in Key Concepts bullets

Do NOT use HTML tags.
Do NOT use tables unless they dramatically improve clarity.
Avoid large paragraphs — prefer bullets and short focused paragraphs.

==================================================
OUTPUT JSON
==================================================

Return ONLY this exact structure:

{
  "learningObjectives": "",

  "notes": "",

  "masterNotes": {
    "title": "",
    "overview": "",
    "learningObjectives": [],
    "modules": [
      {
        "id": "mod-1",
        "title": "",
        "concepts": [],
        "explanation": "",
        "importantPoints": [],
        "examples": [],
        "analogies": [],
        "codeExamples": [],
        "formulas": [],
        "keywords": [],
        "interviewQuestions": [],
        "examNotes": [],
        "commonMistakes": [],
        "memoryTricks": [],
        "practiceQuestions": [],
        "quickRevision": []
      }
    ],
    "glossary": [],
    "cheatSheet": [],
    "finalRevision": [],
    "importantTakeaways": []
  },

  "sections": [
    {
      "title": "",
      "content": "",
      "type": "core_concept",
      "importance": "high",
      "difficulty": "beginner",
      "nextTopic": "",
      "order": 0
    }
  ],

  "knowledgeCore": {
    "metadata": {
      "domain": "tech",
      "level": "beginner"
    },
    "topics": [
      { "id": "topic-1", "name": "Topic Name" }
    ],
    "concepts": [
      { "id": "concept-1", "name": "Concept Name", "explanation": "Simple explanation", "importance": "high", "confidence": 1.0 }
    ],
    "definitions": [
      { "id": "def-1", "term": "Term", "definition": "Definition", "confidence": 1.0 }
    ],
    "comparisons": [
      { "id": "comp-1", "subjectA": "Approach A", "subjectB": "Approach B", "difference": "Key distinction", "confidence": 1.0 }
    ],
    "prerequisites": [],
    "formulas": [
      { "id": "formula-1", "name": "Formula Name", "formula": "E=mc^2", "explanation": "Explanation", "confidence": 1.0 }
    ],
    "glossary": [
      { "id": "glossary-1", "term": "Term", "definition": "Definition" }
    ],
    "relationships": [
      { "id": "rel-1", "sourceId": "concept-1", "targetId": "concept-2", "relationship": "depends_on", "confidence": 1.0 }
    ],
    "realWorldExamples": [],
    "bestPractices": [],
    "commonMistakes": [],
    "revisionPoints": [],
    "interviewInsights": [],
    "timeline": []
  }
}

Allowed values for "type":
  introduction | core_concept | example | advanced | interview | revision | warning | summary | code | project

Allowed values for "importance":
  high | medium | low

Allowed values for "difficulty" and "level":
  beginner | intermediate | advanced

Do not return any additional fields.
`;

export function getSynthesisPrompt({
  goal = "student",
  language = "english",
} = {}) {
  return buildPrompt({
    featurePrompt: SYNTHESIS_FEATURE_PROMPT,
    goal,
    language,
  });
}