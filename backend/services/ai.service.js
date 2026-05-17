import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript";

// ======================================================
// CLIENT
// ======================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 90000,
  maxRetries: 0, // we handle retries manually
});

// ======================================================
// CONFIG
// ======================================================

const TRANSCRIPT_MIN_LENGTH = 80;
const COMPRESS_THRESHOLD = 55000; // chars ~14K tokens
const CHUNK_SIZE = 6000; // chars for tier-3 sectioning
const CHUNK_CONCURRENCY = 2;
const MAX_SECTIONS = 3;
const AI_CALL_TIMEOUT_MS = 120000; // 2 min per call
const FULL_ANALYSIS_TIMEOUT_MS = 240000; // 4 min for full pipeline

// ======================================================
// SAFE HELPERS
// ======================================================

export const safeParse = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    try {
      const cleaned = String(text)
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      return JSON.parse(cleaned);
    } catch {
      // last-resort: extract first {...} block
      try {
        const match = String(text).match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      } catch {
        // intentional fallthrough
      }
      return null;
    }
  }
};

export const safeString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
};

export const safeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value))
    return value.filter((x) => x !== null && x !== undefined);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

export const safeStringArray = (value) => {
  return safeArray(value)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      try {
        return JSON.stringify(item);
      } catch {
        return "";
      }
    })
    .filter(Boolean);
};

export const safeQA = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q) => q && (q.question || q.answer))
    .map((q) => ({
      question: safeString(q.question) || "Question",
      answer: safeString(q.answer) || "Answer",
    }));
};

export const safeExecutionPlan = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item, idx) => {
        if (typeof item === "object" && item !== null) {
          return {
            day: safeString(item.day) || `Day ${idx + 1}`,
            task: safeString(item.task) || safeString(item),
          };
        }
        if (typeof item === "string" && item.trim()) {
          return { day: `Day ${idx + 1}`, task: item.trim() };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [{ day: "Day 1", task: value.trim() }];
  }
  return [];
};

export const safeActionEngine = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).map((item, idx) => ({
    step: safeString(item.step) || String(idx + 1),
    title: safeString(item.title) || `Step ${idx + 1}`,
    whatToDo: safeString(item.whatToDo),
    command: safeString(item.command),
    code: safeString(item.code),
    expectedResult: safeString(item.expectedResult),
    commonMistake: safeString(item.commonMistake),
  }));
};

export const safeProject = (project) => {
  if (!project || typeof project !== "object") {
    return {
      title: "",
      features: [],
      techStack: [],
      folderStructure: [],
      starterCode: "",
    };
  }
  return {
    title: safeString(project.title),
    features: safeStringArray(project.features),
    techStack: safeStringArray(project.techStack),
    folderStructure: safeStringArray(project.folderStructure),
    starterCode: safeString(project.starterCode),
  };
};

export const safeConfusion = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(Boolean)
    .map((item) => ({
      concept: safeString(item.concept),
      simpleExplanation: safeString(item.simpleExplanation),
      realLifeExample: safeString(item.realLifeExample),
    }))
    .filter((item) => item.concept);
};

// ======================================================
// WITH TIMEOUT WRAPPER
// ======================================================

const withTimeout = (promise, ms, label = "Operation") => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// ======================================================
// TRANSCRIPT FETCH WITH RETRIES
// ======================================================

const fetchTranscriptOnce = async (youtubeUrl) => {
  const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);

  if (!transcript || transcript.length === 0) {
    throw new Error("Transcript array empty");
  }

  const fullText = transcript
    .map((item) => (item.text || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\[.*?\]/g, "") // strip [Music], [Applause] etc
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!fullText || fullText.length < TRANSCRIPT_MIN_LENGTH) {
    throw new Error("Transcript too short to be useful");
  }

  return fullText;
};

export const getTranscript = async (youtubeUrl, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎯 Fetching transcript (attempt ${attempt})...`);
      const text = await withTimeout(
        fetchTranscriptOnce(youtubeUrl),
        30000,
        "Transcript fetch",
      );
      console.log(`✅ Transcript fetched: ${text.length} chars`);
      return text;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Transcript attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries)
        await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw new Error(`Transcript unavailable: ${lastError.message}`);
};

// ======================================================
// TRANSCRIPT COMPRESSION (for large transcripts)
// ======================================================

const compressTranscript = async (transcript) => {
  if (transcript.length <= COMPRESS_THRESHOLD) return transcript;

  console.log(`🗜 Compressing transcript (${transcript.length} chars)...`);

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content:
              "You are a transcript compressor. Extract every meaningful concept, fact, example, and explanation. Remove filler words, repetitions, sponsor segments, and off-topic chatter. Preserve ALL technical content, code concepts, and key ideas. Output as continuous prose without losing any learning value.",
          },
          {
            role: "user",
            content: transcript.slice(0, 110000),
          },
        ],
      }),
      AI_CALL_TIMEOUT_MS,
      "Transcript compression",
    );

    const compressed = response.choices[0]?.message?.content || "";
    if (compressed.length > 200) {
      console.log(`✅ Compressed to ${compressed.length} chars`);
      return compressed;
    }
    return transcript;
  } catch (err) {
    console.warn("⚠️ Compression failed, using original:", err.message);
    return transcript;
  }
};

// ======================================================
// FULL ANALYSIS PROMPT BUILDER
// ======================================================

const buildFullAnalysisPrompt = (goal, language) => `
You are a world-class AI learning architect, IIT-level professor, senior software engineer, technical mentor, career strategist, and educational system designer.

==================================================
MISSION
==================================================

Transform this transcript into a COMPLETE LEARNING SYSTEM.

The user must NEVER need:
- YouTube
- Google
- another tutorial
- another explanation

after reading your output.

Your job is NOT summarization.

Your job is:
- reconstruct knowledge
- teach deeply
- explain clearly
- preserve all important learning
- fill missing gaps
- improve weak explanations
- guide implementation
- create mastery-level understanding

The output must feel like:
- premium coaching notes
- IIT professor explanation
- elite technical documentation
- real mentorship
- production-grade educational material

==================================================
USER CONTEXT
==================================================

USER GOAL: ${goal}

OUTPUT LANGUAGE: ${language}

==================================================
STRICT RULES
==================================================

1. Every output MUST be grounded in THIS transcript

2. DO NOT generate generic filler content

3. You MUST preserve ALL important learning from the transcript

4. DO NOT over-compress notes

5. DO NOT skip important explanations

6. If the transcript misses important concepts:
AI MUST intelligently add:
- prerequisites
- missing explanations
- implementation details
- real-world context
- industry best practices

7. Notes must feel like:
- premium handwritten notes
- coaching material
- structured documentation
- complete learning resource

8. The user should NOT need the video again after reading notes

9. developer/job_seeker goal:
include:
- production-grade code
- terminal commands
- folder structures
- scalability ideas
- optimization discussion
- debugging guidance

10. student goal:
include:
- memory tricks
- exam questions
- simplified explanation
- concept connections

11. job_seeker goal:
include:
- interview insights
- hiring expectations
- STAR answers
- resume value

12. executionPlan MUST always be:
[
  {
    "day": "",
    "task": ""
  }
]

13. actionEngine title field is REQUIRED

14. If no project naturally exists:
generate a real-world project inspired by the transcript

15. confusion section must explain:
- difficult concepts
- weakly explained concepts
- hidden assumptions
- beginner confusion

16. DO NOT generate:
- tiny notes
- shallow summaries
- generic output
- surface-level explanations

==================================================
TRANSCRIPT COVERAGE RULE
==================================================

You MUST cover the ENTIRE transcript.

Capture:
- every important concept
- every explanation
- every example
- every workflow
- every implementation detail
- every warning
- every trick
- every advanced insight
- every practical discussion
- every interview insight

DO NOT:
- over compress
- skip sections
- generate tiny notes
- generate surface-level summaries

==================================================
FULL NOTES RULE (MOST IMPORTANT)
==================================================
Your notes must NOT behave like a summary.

Your task is to reconstruct the FULL learning experience from the transcript.

The user should NEVER need to watch the video again after reading the notes.

-----------------------------------
CORE OBJECTIVE
-----------------------------------

Generate COMPLETE STUDY NOTES from the transcript.

Capture:
- every important concept
- every explanation
- every technique
- every example
- every workflow
- every strategy
- every warning
- every important discussion

DO NOT compress too much.

DO NOT create short notes.

DO NOT skip sections.

-----------------------------------
TRANSCRIPT COVERAGE RULE
-----------------------------------

You MUST cover the ENTIRE transcript.

If the transcript has:
- introduction
- explanation
- examples
- practical implementation
- interview tips
- mistakes
- advanced concepts
- hidden insights

Then ALL must appear in notes.

NEVER skip important sections.

-----------------------------------
MISSING KNOWLEDGE RULE
-----------------------------------

If the teacher missed:
- explanation
- important concept
- prerequisite
- real-world usage
- edge case
- implementation detail

Then AI MUST intelligently ADD it.

Add a special section:

"Important Missing Concepts"

Explain:
- what was missing
- why it matters
- proper explanation

-----------------------------------
TEACHING STYLE
-----------------------------------

Notes must feel like:
- premium handwritten notes
- IIT professor explanation
- real coaching material
- structured documentation

Use:
- headings
- subheadings
- bullet points
- examples
- analogies
- code blocks
- formulas
- tables when useful

-----------------------------------
DEPTH RULE
-----------------------------------

For every important topic:

1. Definition
2. Why important
3. How it works
4. Real-world use
5. Example
6. Common mistakes
7. Interview perspective
8. Advanced insights

-----------------------------------
TECH CONTENT RULE
-----------------------------------

If programming/coding exists:

ALWAYS include:
- code explanation
- flow explanation
- architecture explanation
- why approach is used
- optimization discussion
- best practices
- beginner explanation
- advanced explanation

-----------------------------------
ANTI-SUMMARY RULE
-----------------------------------

DO NOT generate:
- tiny notes
- compressed explanations
- generic output
- surface-level summary

Generate:
DETAILED LEARNING NOTES.

-----------------------------------
OUTPUT QUALITY
-----------------------------------

Notes must feel:
- premium
- detailed
- educational
- production quality
- revision-ready
- complete

-----------------------------------
VERY IMPORTANT
-----------------------------------

If transcript is weak:
AI MUST UPGRADE the teaching quality.

If transcript skips steps:
AI MUST fill missing steps.

If transcript assumes prior knowledge:
AI MUST explain prerequisites.

If transcript explanation is confusing:
AI MUST simplify it.

-----------------------------------
FINAL GOAL
-----------------------------------

After reading notes:
the user should NOT need:
- YouTube
- Google
- another tutorial

The notes themselves must become the COMPLETE learning resource.
==================================================
SUMMARY RULE
==================================================

Summary must explain:
- what this video teaches
- who should learn it
- practical value
- real-world relevance
- difficulty level
- final outcome
- career relevance

The summary should feel like:
a premium course overview.

==================================================
KEY POINTS RULE
==================================================
Key points must:

- capture ONLY high-value insights
- be memorable
- be revision friendly
- avoid generic statements
- include practical takeaways
- include hidden insights
- include interview-level concepts

Each point should feel:
important enough to remember permanently.

==================================================
ACTION STEPS RULE
==================================================
Action steps must be:

- specific
- executable
- practical
- step-by-step

Avoid generic advice.

Every step must:
- produce measurable progress
- move the user toward mastery
- feel actionable immediately

If coding:
include setup → implementation → deployment.

If academic:
include study → revision → practice → mastery.

If career:
include portfolio → interview → resume → networking.
==================================================
ROADMAP RULE
==================================================
Roadmap must include:

- beginner phase
- intermediate phase
- advanced phase
- mastery phase

For each phase include:
- goals
- skills
- practical outcomes
- project suggestions
- estimated time
- common mistakes

The roadmap should feel like:
a premium mentorship program.

==================================================
Q&A RULE
==================================================
Generate questions that test:

- conceptual understanding
- practical thinking
- real-world application
- interview readiness
- deep understanding

Include:
- beginner questions
- intermediate questions
- advanced questions
- tricky interview questions

Answers must teach,
not just respond.

==================================================
CONFUSION DETECTION RULE
==================================================
Identify concepts that are:
- confusing
- skipped quickly
- poorly explained
- assumed knowledge

For each concept:
- simplify deeply
- use analogies
- explain intuitively
- explain visually in words
- explain why beginners struggle
- explain common misunderstandings
==================================================
REAL WORLD APPLICATION RULE
==================================================

Explain:
- where concepts are used
- industry usage
- startup usage
- company usage
- production usage
- why companies care

==================================================
INTERVIEW INSIGHT RULE
==================================================

Generate:
- real interview questions
- strong answers
- hiring expectations
- resume-worthy insights
- common interview traps

==================================================
REVISION NOTES RULE
==================================================

Generate:
- ultra-short memory bullets
- quick revision points
- exam recall notes
- interview recall notes

==================================================
TECH CONTENT RULE
==================================================

If coding/programming exists:

ALWAYS include:
- architecture explanation
- folder structure
- scalability discussion
- production best practices
- optimization techniques
- security concerns
- debugging guidance
- deployment considerations
- code explanation
- why this approach is used

==================================================
PROJECT RULE
==================================================
Projects must feel:
real-world and portfolio worthy.

Generate:
- startup-level ideas
- production-grade architecture
- real feature list
- scalable structure
- deployment ideas
- monetization ideas
- resume value

Avoid toy projects.

==================================================
ACTION ENGINE RULE
==================================================

Action engine must behave like:
a senior implementation mentor.

For every step include:
- why this matters
- exact execution steps
- terminal commands
- code snippets
- expected results
- debugging help
- optimization advice
- common mistakes
- production best practices

The user should be able to execute
WITHOUT external tutorials.

==================================================
GOAL ADAPTATION RULE
==================================================

If goal = student:
- focus on understanding
- focus on memory retention
- focus on revision
- simplify difficult concepts deeply

If goal = developer:
- focus on implementation
- focus on architecture
- focus on production systems
- focus on scalability

If goal = job_seeker:
- focus on interviews
- focus on resume projects
- focus on practical hiring skills
- focus on industry expectations

==================================================
LONG VIDEO RULE
==================================================

This transcript may represent a VERY LONG video.

DO NOT:
- compress heavily
- remove important concepts
- skip sections for brevity

Your output must preserve the FULL LEARNING EXPERIENCE.

==================================================
OUTPUT QUALITY RULE
==================================================

Output must feel:
- premium
- educational
- deeply useful
- structured
- production quality
- actionable
- comprehensive
- mentorship-level

==================================================
RETURN FORMAT RULE
==================================================

RETURN ONLY VALID JSON.

NO:
- markdown fences
- explanations outside JSON
- comments
- invalid JSON

==================================================
EXACT OUTPUT SCHEMA
==================================================

{
  "contentType": "tech | academic | exam | interview | business | general",

  "summary": "Detailed executive understanding of the full video including purpose, concepts taught, real-world relevance, practical outcomes, and final learning value",

  "keyPoints": [],

  "notes": "VERY DETAILED premium markdown study notes covering the ENTIRE transcript with structured explanations, examples, code, analogies, advanced insights, real-world usage, interview insights, and missing concept explanations",

  "revisionNotes": [],

  "actionSteps": [],

  "confusion": [
    {
      "concept": "",
      "simpleExplanation": "",
      "realLifeExample": ""
    }
  ],

  "missingConcepts": [
    {
      "topic": "",
      "whyImportant": "",
      "detailedExplanation": ""
    }
  ],

  "roadmap": [],

  "qa": [
    {
      "question": "",
      "answer": ""
    }
  ],

  "learningPath": [],

  "realWorldApplications": [
    {
      "concept": "",
      "whereUsed": "",
      "industryUsage": "",
      "whyCompaniesUseIt": ""
    }
  ],

  "interviewInsights": [
    {
      "topic": "",
      "commonQuestion": "",
      "strongAnswer": ""
    }
  ],

  "project": {
    "title": "",
    "features": [],
    "techStack": [],
    "folderStructure": [],
    "starterCode": ""
  },

  "executionPlan": [
    {
      "day": "",
      "task": ""
    }
  ],

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
  ],

  "outcome": "Detailed transformation result explaining what practical skills, understanding, implementation ability, and real-world capability the user will gain"
}
`;

// ======================================================
// SINGLE AI CALL (TIER 1 & 2: SHORT / MEDIUM VIDEOS)
// ======================================================

const runSingleAnalysis = async (transcript, goal, language) => {
  console.log("🧠 Running single-pass full analysis...");

  const response = await withTimeout(
    openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildFullAnalysisPrompt(goal, language),
        },
        {
          role: "user",
          content: `TRANSCRIPT:\n\n${transcript}`,
        },
      ],
    }),
    AI_CALL_TIMEOUT_MS,
    "Single analysis",
  );

  const raw = response.choices[0]?.message?.content || "";
  const parsed = safeParse(raw);

  if (!parsed || !parsed.summary) {
    throw new Error("Single analysis returned empty or unparseable JSON");
  }

  return parsed;
};

// ======================================================
// SECTION PROMPT BUILDER (TIER 3: LONG VIDEOS)
// ======================================================

const buildSectionPrompt = (goal, language, sectionIndex, totalSections) =>
  `You are analyzing section ${sectionIndex + 1} of ${totalSections} from a longer video.
Goal: ${goal}. Language: ${language}.
Extract from THIS SECTION ONLY:

Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary of this section",
  "keyPoints": ["5-8 key points from this section"],
  "notes": "detailed notes in markdown for this section",
  "actionSteps": ["concrete actions from this section"],
  "confusion": [{"concept": "", "simpleExplanation": "", "realLifeExample": ""}]
}`;

// ======================================================
// SECTION PROCESSOR (for tier-3 large videos)
// ======================================================

const processSection = async (
  section,
  goal,
  language,
  sectionIndex,
  totalSections,
  retries = 2,
) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await withTimeout(
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.2,
          max_tokens: 1800,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: buildSectionPrompt(
                goal,
                language,
                sectionIndex,
                totalSections,
              ),
            },
            {
              role: "user",
              content: `SECTION TRANSCRIPT:\n\n${section}`,
            },
          ],
        }),
        AI_CALL_TIMEOUT_MS,
        `Section ${sectionIndex + 1} analysis`,
      );

      const parsed = safeParse(response.choices[0]?.message?.content);
      if (parsed && parsed.summary && parsed.summary.length > 30) {
        return parsed;
      }
      throw new Error("Weak section output");
    } catch (err) {
      lastError = err;
      console.warn(
        `⚠️ Section ${sectionIndex + 1} attempt ${attempt} failed: ${err.message}`,
      );
      if (attempt < retries)
        await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  console.warn(
    `❌ Section ${sectionIndex + 1} gave up after ${retries} attempts`,
  );
  return null;
};

// ======================================================
// SYNTHESIS PASS (TIER 3: merge sections + generate advanced fields)
// ======================================================

const runSynthesisPass = async (sections, goal, language) => {
  console.log("🔗 Running synthesis pass over sections...");

  const combinedSummaries = sections
    .map((s, i) => `Section ${i + 1}: ${s.summary}`)
    .join("\n\n");
  const combinedNotes = sections.map((s) => s.notes || "").join("\n\n---\n\n");
  const combinedKeyPoints = [
    ...new Set(sections.flatMap((s) => safeArray(s.keyPoints))),
  ];
  const combinedActionSteps = [
    ...new Set(sections.flatMap((s) => safeArray(s.actionSteps))),
  ];
  const combinedConfusion = sections.flatMap((s) => safeArray(s.confusion));

  const response = await withTimeout(
    openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 3500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildFullAnalysisPrompt(goal, language),
        },
        {
          role: "user",
          content: `
This is a pre-analyzed video broken into sections. Use this data to generate the complete analysis output.

COMBINED SECTION SUMMARIES:
${combinedSummaries}

KEY POINTS SO FAR:
${combinedKeyPoints.slice(0, 30).join("\n")}

ACTION STEPS SO FAR:
${combinedActionSteps.slice(0, 20).join("\n")}

Produce the full JSON output including roadmap, qa, project, executionPlan, actionEngine, learningPath, and outcome.
Consolidate the summary from the section summaries above.
Merge and deduplicate keyPoints and actionSteps.
Combine notes into one comprehensive markdown document.
          `.trim(),
        },
      ],
    }),
    AI_CALL_TIMEOUT_MS,
    "Synthesis pass",
  );

  const parsed = safeParse(response.choices[0]?.message?.content);

  if (!parsed || !parsed.summary) {
    // fallback: build a merged object manually from sections
    return {
      contentType: "general",
      summary: combinedSummaries.slice(0, 1000),
      keyPoints: combinedKeyPoints.slice(0, 15),
      notes: combinedNotes,
      actionSteps: combinedActionSteps.slice(0, 8),
      confusion: combinedConfusion,
      roadmap: [],
      qa: [],
      learningPath: [],
      project: {
        title: "",
        features: [],
        techStack: [],
        folderStructure: [],
        starterCode: "",
      },
      executionPlan: [],
      actionEngine: [],
      outcome: "",
    };
  }

  // Merge notes from sections if synthesis note is thin
  if (!parsed.notes || parsed.notes.length < 500) {
    parsed.notes = combinedNotes;
  }

  return parsed;
};

// ======================================================
// SECTION SPLITTER
// ======================================================

const splitIntoSections = (transcript, maxSections = MAX_SECTIONS) => {
  const targetSize = Math.ceil(transcript.length / maxSections);
  const sections = [];

  for (let i = 0; i < maxSections; i++) {
    const start = i * targetSize;
    const end = Math.min(start + targetSize + 500, transcript.length); // 500 char overlap

    const chunk = transcript.slice(start, end).trim();
    if (chunk.length > 100) sections.push(chunk);
  }

  return sections;
};

// ======================================================
// SECTION PROCESSOR WITH CONCURRENCY CAP
// ======================================================

const processSectionsWithConcurrency = async (sections, goal, language) => {
  const results = [];

  for (let i = 0; i < sections.length; i += CHUNK_CONCURRENCY) {
    const batch = sections.slice(i, i + CHUNK_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((section, batchIdx) =>
        processSection(section, goal, language, i + batchIdx, sections.length),
      ),
    );
    results.push(...batchResults);
    if (i + CHUNK_CONCURRENCY < sections.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results.filter(Boolean);
};

// ======================================================
// FALLBACK: MINI MODEL FULL ANALYSIS
// ======================================================

const runMiniFallbackAnalysis = async (transcript, goal, language) => {
  console.log("⚡ Running mini-model fallback analysis...");

  const response = await withTimeout(
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildFullAnalysisPrompt(goal, language),
        },
        {
          role: "user",
          content: `TRANSCRIPT:\n\n${transcript.slice(0, 40000)}`,
        },
      ],
    }),
    AI_CALL_TIMEOUT_MS,
    "Mini fallback analysis",
  );

  const parsed = safeParse(response.choices[0]?.message?.content);

  if (!parsed || !parsed.summary) {
    throw new Error("Mini fallback also returned empty output");
  }

  return parsed;
};

// ======================================================
// OUTPUT VALIDATOR
// ======================================================

export const validateAIResult = (result) => {
  if (!result || typeof result !== "object") return false;
  if (!result.summary || result.summary.length < 60) return false;
  if (!result.notes || result.notes.length < 100) return false;
  if (!Array.isArray(result.keyPoints) || result.keyPoints.length < 2)
    return false;
  return true;
};

// ======================================================
// NORMALIZE OUTPUT (applied before returning from runAI)
// ======================================================

const normalizeOutput = (raw) => ({
  contentType: safeString(raw.contentType || "general").toLowerCase(),
  summary: safeString(raw.summary),
  keyPoints: safeStringArray(raw.keyPoints).slice(0, 20),
  notes: safeString(raw.notes),
  actionSteps: safeStringArray(raw.actionSteps).slice(0, 10),
  confusion: safeConfusion(raw.confusion),
  roadmap: safeStringArray(raw.roadmap).slice(0, 20),
  qa: safeQA(raw.qa),
  learningPath: safeStringArray(raw.learningPath),
  project: safeProject(raw.project),
  // Keep raw for worker to normalize with full safeExecutionPlan / safeActionEngine
  executionPlan: raw.executionPlan,
  actionEngine: raw.actionEngine,
  outcome: safeString(raw.outcome),
});

// ======================================================
// MAIN AI ENGINE
// ======================================================

export const runAI = async ({ youtubeUrl, goal, language }) => {
  console.log("🚀 AI Engine starting...");

  // ── Step 1: Transcript ──────────────────────────────
  const transcript = await getTranscript(youtubeUrl);
  console.log(`📄 Transcript length: ${transcript.length} chars`);

  // ── Step 2: Route by transcript size ────────────────
  const TIER2_THRESHOLD = COMPRESS_THRESHOLD; // ~55K chars
  const TIER3_THRESHOLD = COMPRESS_THRESHOLD * 3; // ~165K chars

  let rawResult;

  if (transcript.length <= TIER2_THRESHOLD) {
    // ── TIER 1: Short video — direct single call ──────
    console.log("📊 Tier 1: Direct single-call analysis");
    try {
      rawResult = await runSingleAnalysis(transcript, goal, language);
    } catch (err) {
      console.warn(
        "⚠️ Tier 1 failed, falling back to mini model:",
        err.message,
      );
      rawResult = await runMiniFallbackAnalysis(transcript, goal, language);
    }
  } else if (transcript.length <= TIER3_THRESHOLD) {
    // ── TIER 2: Medium video — compress then single call ──
    console.log("📊 Tier 2: Compress then single-call analysis");
    const compressed = await compressTranscript(transcript);
    try {
      rawResult = await runSingleAnalysis(compressed, goal, language);
    } catch (err) {
      console.warn("⚠️ Tier 2 gpt-4o failed, trying mini:", err.message);
      rawResult = await runMiniFallbackAnalysis(compressed, goal, language);
    }
  } else {
    // ── TIER 3: Long video — section + synthesis ─────
    console.log("📊 Tier 3: Section analysis + synthesis");
    const sections = splitIntoSections(transcript, MAX_SECTIONS);
    console.log(`🧩 Split into ${sections.length} sections`);
    const sectionResults = await processSectionsWithConcurrency(
      sections,
      goal,
      language,
    );

    if (sectionResults.length === 0) {
      throw new Error("All sections failed — transcript may be unsupported");
    }

    try {
      rawResult = await runSynthesisPass(sectionResults, goal, language);
    } catch (err) {
      console.warn(
        "⚠️ Synthesis pass failed, using compressed fallback:",
        err.message,
      );
      const compressed = await compressTranscript(transcript);
      rawResult = await runMiniFallbackAnalysis(compressed, goal, language);
    }
  }

  // ── Step 3: Validate ─────────────────────────────────
  if (!validateAIResult(rawResult)) {
    throw new Error(
      "AI output failed quality validation — summary or notes missing",
    );
  }

  // ── Step 4: Normalize ────────────────────────────────
  const normalized = normalizeOutput(rawResult);

  console.log("✅ AI Engine complete");
  return normalized;
};

export default runAI;
