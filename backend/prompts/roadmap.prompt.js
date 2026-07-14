/**
 * ============================================================================
 * AI Learning OS
 * Roadmap Prompt
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate personalized learning roadmap, learning path and execution plan.
 *
 * Used ONLY by:
 * roadmap.generator.js
 *
 * Generates:
 * - roadmap
 * - learningPath
 * - executionPlan
 * ============================================================================
 */

import { buildPrompt } from "./builders/prompt.builder.js";

const ROADMAP_FEATURE_PROMPT = `
==================================================
MISSION
==================================================

Generate a COMPLETE learning roadmap.

The roadmap should help the learner master the topic
covered in the transcript.

The roadmap must feel like guidance from a senior mentor.

==================================================
GOAL
==================================================

Create a structured learning journey.

The learner should know:

• what to learn first

• what comes next

• what to practice

• how to progress

• when to move forward

==================================================
ROADMAP
==================================================

Generate between 10 and 30 roadmap steps.

Each step should represent one logical milestone.

Do NOT repeat concepts.

Arrange from beginner to advanced.

==================================================
LEARNING PATH
==================================================

Generate a practical learning path.

Include:

• prerequisites

• recommended study order

• revision checkpoints

• practice suggestions

• interview preparation milestones

Keep it transcript grounded.

==================================================
EXECUTION PLAN
==================================================

Generate an actionable execution plan.

Each item should contain:

day

task

The execution plan should be realistic.

Arrange tasks in progressive order.

==================================================
TECH CONTENT
==================================================

If content type is TECH:

Focus on:

• implementation

• coding practice

• projects

• debugging

• architecture

• interview preparation

==================================================
ACADEMIC CONTENT
==================================================

If content type is ACADEMIC:

Focus on:

• concepts

• formulas

• derivations

• revision

• exams

==================================================
GENERAL CONTENT
==================================================

If content type is GENERAL:

Focus on:

• habits

• practical actions

• real-world application

• continuous improvement

==================================================
QUALITY
==================================================

The roadmap should:

• be actionable

• avoid repetition

• be logically ordered

• feel like mentorship

• guide the learner step-by-step

==================================================
OUTPUT JSON
==================================================

Return ONLY:

{
  "roadmap": [
    ""
  ],

  "learningPath": [
    ""
  ],

  "executionPlan": [
    {
      "day": "",
      "task": ""
    }
  ]
}

Do not return any additional fields.
`;

export function getRoadmapPrompt({
  goal = "student",
  language = "english",
} = {}) {
  return buildPrompt({
    featurePrompt: ROADMAP_FEATURE_PROMPT,
    goal,
    language,
  });
}