/**
 * ============================================================================
 * AI Learning OS
 * Project Prompt
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Generate implementation project and action engine.
 *
 * Used ONLY by:
 * project.generator.js
 *
 * Generates:
 * - project
 * - actionEngine
 * ============================================================================
 */

import { buildPrompt } from "./builders/prompt.builder.js";

const PROJECT_FEATURE_PROMPT = `
==================================================
MISSION
==================================================

Generate a REAL-WORLD implementation project.

The learner should be able to apply the knowledge
from the transcript immediately.

The generated project should feel like something
a Senior Software Engineer would recommend.

==================================================
GOAL
==================================================

Convert theory into practical implementation.

Generate a project that helps the learner:

• practice concepts

• build portfolio

• prepare for interviews

• understand architecture

• gain real-world experience

==================================================
WHEN TO GENERATE
==================================================

If contentType is:

TECH

Generate complete project.

If contentType is:

ACADEMIC

Generate practical mini implementation only
when appropriate.

Otherwise return an empty project object.

If contentType is:

GENERAL

Do NOT generate software projects.

Instead generate practical real-world actions.

==================================================
PROJECT
==================================================

The project should contain:

• title

• overview

• objectives

• core features

• recommended tech stack (TECH only)

• folder structure (TECH only)

• implementation steps

• expected learning outcome

==================================================
TECH CONTENT
==================================================

When content type is TECH:

Include:

• project architecture

• folder structure

• database suggestions (if applicable)

• API ideas

• best practices

• scalability considerations

• deployment suggestions

Never generate toy projects.

Prefer portfolio-quality projects.

==================================================
ACTION ENGINE
==================================================

Generate an Action Engine.

Each step must contain:

step

title

whatToDo

command

code

expectedResult

commonMistake

Purpose:

Guide the learner step-by-step from theory
to implementation.

==================================================
COMMANDS
==================================================

Include commands only when applicable.

Examples:

npm install

npm run dev

git clone

docker compose up

Never invent commands unsupported by the transcript.

==================================================
CODE
==================================================

Only include starter code when genuinely useful.

Avoid large code dumps.

Prefer minimal, educational examples.

==================================================
QUALITY
==================================================

The generated project must be:

• practical

• realistic

• portfolio worthy

• transcript grounded

• production minded

==================================================
OUTPUT JSON
==================================================

Return ONLY:

{
  "project": {
    "title": "",
    "overview": "",
    "objectives": [],
    "features": [],
    "techStack": [],
    "folderStructure": [],
    "implementationSteps": [],
    "starterCode": "",
    "expectedOutcome": ""
  },

  "actionEngine": [
    {
      "step": "",
      "title": "",
      "whatToDo": "",
      "command": "",
      "code": "",
      "expectedResult": "",
      "commonMistake": ""
    }
  ]
}

If project generation is not applicable,
return:

{
  "project": {},
  "actionEngine": []
}

Do not return any additional fields.
`;

export function getProjectPrompt({
  goal = "student",
  language = "english",
} = {}) {
  return buildPrompt({
    featurePrompt: PROJECT_FEATURE_PROMPT,
    goal,
    language,
  });
}