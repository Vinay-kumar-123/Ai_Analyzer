import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------- TRANSCRIPT ----------------
const getTranscript = async (youtubeUrl) => {
  console.log("🎯 Fetching transcript...");
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);

    if (!transcript || transcript.length === 0) {
      throw new Error("No transcript found");
    }

    console.log("✅ Transcript fetched");
    return transcript.map((t) => t.text).join(" ");
  } catch (err) {
    throw new Error("Failed to fetch transcript");
  }
};

// ---------------- SMART CHUNK ----------------
const chunkText = (text, size = 2000) => {
  const sentences = text.split(". ");
  const chunks = [];
  let current = "";

  for (let s of sentences) {
    if ((current + s).length > size) {
      chunks.push(current);
      current = s;
    } else {
      current += " " + s;
    }
  }

  if (current) chunks.push(current);

  // 🔥 limit chunks (cost control)
  return chunks.slice(0, 5);
};

// ---------------- PROMPT ----------------

const buildPrompt = (chunk, goal, language) => `
You are a senior mentor, technical architect, teacher, and execution coach.

Your purpose:
Analyze → Extract → Guide → Help user execute

-----------------------------------
CRITICAL RULE (VERY IMPORTANT)
-----------------------------------

Summary, KeyPoints, Notes MUST be derived ONLY from the transcript.

- Do NOT add external knowledge
- Do NOT assume anything
- Do NOT expand beyond what is spoken
- Only rephrase for clarity

If something is not mentioned → DO NOT include it

-----------------------------------
AI EXTENSION RULE (IMPORTANT)
-----------------------------------

The following MUST be generated using your reasoning (NOT limited to transcript):

- actionSteps
- actionEngine
- roadmap
- executionPlan
- project
- outcome

-----------------------------------
CONTENT TYPE DETECTION (STRICT)
-----------------------------------

Detect ONE type:

tech | academic | exam | interview | general

Rules:

- If transcript contains:
  programming, coding, Node.js, JavaScript, React, API, backend, frontend
  → contentType = "tech"

- If transcript contains:
  theory, concepts, study explanation
  → contentType = "academic"

- If interview preparation → "interview"

- If unsure BUT programming exists → ALWAYS choose "tech"

-----------------------------------
INPUT
-----------------------------------

Goal: ${goal}
Language: ${language}

Transcript:
${chunk}

-----------------------------------
OUTPUT FORMAT (STRICT JSON ONLY)
-----------------------------------

{
  "contentType": "",

  "summary": "",
  "keyPoints": [],
  "notes": "",

  "actionSteps": [],

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

  "roadmap": [],

  "qa": [
    {
      "question": "",
      "answer": ""
    }
  ],

  "learningPath": [],

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

  "outcome": "",

  "confusion": [
    {
      "concept": "",
      "simpleExplanation": "",
      "realLifeExample": ""
    }
  ]
}

-----------------------------------
STRICT RULES
-----------------------------------

1. ALWAYS include:
summary, keyPoints, notes, actionSteps, roadmap, qa, outcome

2. TECH CONTENT (VERY IMPORTANT):
If contentType = "tech":

- MUST generate:
  ✔ actionEngine (step-by-step execution)
  ✔ project (real buildable project)
  ✔ executionPlan (day-wise plan)

- DO NOT leave them empty

3. NON-TECH CONTENT:

- actionEngine = []
- project = empty object

4. GOAL ADAPTATION:

- student → simple explanation
- developer → code + architecture + implementation
- job_seeker → interview + resume points

5. QUALITY RULES:

- Avoid generic points
- Avoid repetition
- Be practical and actionable
- Keep output structured

6. OUTPUT:

- Return ONLY JSON
- No markdown
- No explanation
`;
// ---------------- SAFE PARSE ----------------
const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const cleaned = text
        .replace(/```json|```/g, "")
        .replace(/\n/g, " ")
        .trim();

      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
};

// ---------------- PROCESS CHUNK ----------------
const processChunk = async (chunk, goal, language) => {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You must return ONLY valid JSON. No text outside JSON.",
        },
        {
          role: "user",
          content: buildPrompt(chunk, goal, language),
        },
      ],
      temperature: 0.3,
    });

    return safeParse(res.choices[0].message.content);
  } catch (err) {
    console.error("AI chunk error:", err.message);
    return null;
  }
};

// ---------------- MERGE ----------------
const mergeResults = (results) => {
  const typeCount = {};
  results.forEach((r) => {
    if (!r?.contentType) return;
    typeCount[r.contentType] = (typeCount[r.contentType] || 0) + 1;
  });

  const contentType =
    Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "general";
  return {
    contentType,

    summary: results.map((r) => r?.summary).join(" "),
    keyPoints: [...new Set(results.flatMap((r) => r?.keyPoints || []))],
    notes: results.map((r) => r?.notes).join("\n\n"),

    actionSteps: [...new Set(results.flatMap((r) => r?.actionSteps || []))],
    actionEngine: results.flatMap((r) => r?.actionEngine || []),

    roadmap: results.flatMap((r) => r?.roadmap || []),
    qa: results.flatMap((r) => r?.qa || []),

    learningPath: results.flatMap((r) => r?.learningPath || []),

    project: results.find((r) => r?.project?.title)?.project || {
      title: "",
      features: [],
      techStack: [],
      folderStructure: [],
      starterCode: "",
    },

    executionPlan: results.flatMap((r) => r?.executionPlan || []),

    outcome: results.map((r) => r?.outcome).join(" "),

    confusion: results.flatMap((r) => r?.confusion || []),
  };
};

// ---------------- SAFETY FILTER ----------------


// ---------------- MAIN ----------------
export const runAI = async ({ youtubeUrl, goal, language }) => {
  const transcript = await getTranscript(youtubeUrl);

  if (!transcript || transcript.length < 50) {
    throw new Error("Transcript too short");
  }

  const chunks = chunkText(transcript);

  const results = await Promise.all(
    chunks.map((chunk) => processChunk(chunk, goal, language)),
  );

  const filtered = results.filter(Boolean);

  if (filtered.length === 0) {
    throw new Error("AI processing failed");
  }

  let merged = mergeResults(filtered);
  return merged;
};
