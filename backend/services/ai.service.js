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
  } catch {
    throw new Error("Failed to fetch transcript");
  }
};

// ---------------- CHUNK ----------------
const chunkText = (text, size = 8000) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
};

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

// ---------------- PROMPT ----------------
const buildPrompt = (chunk, goal, language) => `
Return ONLY valid JSON.

You are a senior AI teacher, mentor, and execution coach.

-----------------------------------
YOUR GOAL
-----------------------------------

User should NOT need to watch the video again.

-----------------------------------
CORE TASK
-----------------------------------

1. Extract from transcript
2. Explain clearly
3. Fill missing gaps
4. Improve weak explanations
5. Add examples + real-world clarity

-----------------------------------
IMPORTANT RULES
-----------------------------------

1. Summary, KeyPoints MUST come from transcript only
2. Notes CAN expand using your knowledge for clarity
3. Avoid generic explanations
4. Avoid repetition
5. Be practical and structured

-----------------------------------
CONTENT TYPE DETECTION
-----------------------------------

Detect ONE:

tech | academic | exam | interview | general

RULES:
- Coding / programming → tech
- Theory / study → academic
- Interview prep → interview

-----------------------------------
GOAL ADAPTATION
-----------------------------------

- student → simple explanation
- developer → code + architecture
- job_seeker → interview + practical

-----------------------------------
TECH MODE (VERY IMPORTANT)
-----------------------------------

If contentType = "tech":

- MUST generate:
  ✔ actionEngine (step-by-step execution)
  ✔ project (real buildable)
  ✔ executionPlan

-----------------------------------
OUTPUT FORMAT (STRICT JSON)
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
INPUT
-----------------------------------

Goal: ${goal}
Language: ${language}

Transcript:
${chunk}
`;

// ---------------- PROCESS CHUNK ----------------
const processChunk = async (chunk, goal, language) => {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Return ONLY valid JSON",
        },
        {
          role: "user",
          content: buildPrompt(chunk, goal, language),
        },
      ],
    });

    return safeParse(res.choices[0].message.content);
  } catch (err) {
    console.error("Chunk error:", err.message);
    return null;
  }
};

// ---------------- SMART MERGE ----------------
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
    summary: results.map((r) => r.summary).join(" "),
    keyPoints: [...new Set(results.flatMap((r) => r.keyPoints || []))],
    notes: results.map((r) => r.notes).join("\n\n"),
    actionSteps: [...new Set(results.flatMap((r) => r.actionSteps || []))],
    roadmap: results.flatMap((r) => r.roadmap || []),
    qa: results.flatMap((r) => r.qa || []),
    learningPath: results.flatMap((r) => r.learningPath || []),
    executionPlan: results.flatMap((r) => r.executionPlan || []),
    outcome: results.map((r) => r.outcome).join(" "),
    confusion: results.flatMap((r) => r.confusion || []),
    actionEngine: results.flatMap((r) => r.actionEngine || []),
    project: results.find((r) => r.project?.title)?.project || {},
  };
};

// ---------------- CLEAN LAYER ----------------
const refineLayer = async (merged) => {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Clean repetition, structure properly, return JSON only",
      },
      {
        role: "user",
        content: JSON.stringify(merged),
      },
    ],
  });

  return safeParse(res.choices[0].message.content) || merged;
};

// ---------------- DEEP LAYER ----------------
const deepLayer = async (data) => {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Return ONLY JSON.

Improve:
- explanations
- fill missing gaps
- make deeper understanding
        `,
      },
      {
        role: "user",
        content: JSON.stringify(data),
      },
    ],
  });

  return safeParse(res.choices[0].message.content) || data;
};

// ---------------- TEACHING LAYER ----------------
const teachingLayer = async (data) => {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
Return ONLY JSON.

You are an IIT professor.

Transform into:
- beginner + advanced explanation
- real-world examples
- clear teaching format
        `,
      },
      {
        role: "user",
        content: JSON.stringify(data),
      },
    ],
  });

  return safeParse(res.choices[0].message.content) || data;
};

// ---------------- MAIN ----------------
export const runAI = async ({ youtubeUrl, goal, language }) => {
  const transcript = await getTranscript(youtubeUrl);

  if (!transcript || transcript.length < 50) {
    throw new Error("Transcript too short");
  }

  const chunks = chunkText(transcript);

  // 🔹 Layer 1
  const results = await Promise.all(
    chunks.map((chunk) => processChunk(chunk, goal, language)),
  );

  const filtered = results.filter(Boolean);

  if (!filtered.length) {
    throw new Error("AI processing failed");
  }

  // 🔹 Merge
  const merged = mergeResults(filtered);

  // 🔹 NEW LAYERS (IMPORTANT)
  const refined = await refineLayer(merged);
  const deep = await deepLayer(refined);
  const taught = await teachingLayer(deep);

  return taught;
};
