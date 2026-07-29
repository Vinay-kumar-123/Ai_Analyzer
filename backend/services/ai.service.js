import { resolveTranscript } from "./transcript.resolver.js";

import {
  MAX_TRANSCRIPT_CHARS,
  MIN_TRANSCRIPT_CHARS,
  MESSAGES,
} from "../config/limits.js";

import { generateNotes } from "../generators/notes.generator.js";
import { generateSummary } from "../generators/summary.generator.js";
import { executeGenerator } from "../generators/generator.registry.js";
import { extractVideoId } from "../utils/youtubeMeta.js";

export { extractVideoId };

// ─── Transcript validation (used by runLazyGeneration below) ─────────────────
const validateTranscript = (transcript) => {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  const trimmed = transcript.trim();

  if (!trimmed) throw new Error("Transcript is empty.");
  if (trimmed.length < MIN_TRANSCRIPT_CHARS) throw new Error(MESSAGES.TRANSCRIPT_TOO_SHORT);
  if (trimmed.length > MAX_TRANSCRIPT_CHARS) throw new Error(MESSAGES.TRANSCRIPT_TOO_LARGE);
};

// ─── Transcript fetch ─────────────────────────────────────────────────────────
// Delegates to transcript.resolver.js — public signature unchanged.
// youtube-transcript remains the only extraction library.
export const getTranscript = async (youtubeUrl, maxRetries = 3, targetLang = null) => {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) throw new Error(MESSAGES.INVALID_URL);
  return resolveTranscript(videoId, { maxRetries, targetLang });
};

// ─── Initial analysis (Master Notes V3 Pipeline) ─────────────────────────────
export const runInitialAnalysis = async ({
  youtubeUrl,
  goal = "student",
  language = "english",
}) => {
  // Step 1: Transcript fetched EXACTLY ONCE
  const transcript = await getTranscript(youtubeUrl, 3, language);

  // Step 2: Generate Master Notes V3 (Canonical Knowledge Base)
  const notesResult = await generateNotes({ transcript, goal, language });

  // Step 3: Generate Summary & Key Points consuming Notes V3 (NOT transcript)
  const summaryResult = await generateSummary({
    notesV3: notesResult.masterNotes || notesResult.notes || notesResult.sections,
    goal,
    language,
  });

  return {
    transcript,
    ...summaryResult,
    learningObjectives: notesResult.learningObjectives,
    notes:              notesResult.notes,
    sections:           notesResult.sections,
    masterNotes:        notesResult.masterNotes,
    notesGenerated:     true,
  };
};

// ─── Lazy generation ───────────────────────────────────────────────────────────
// Returns the raw generator output.
// Normalization is done once by the caller (performLazyGeneration in controller).
export const runLazyGeneration = async ({
  notesV3,
  transcript,
  goal = "student",
  language = "english",
  part,
  sourceMeta = {},
}) => {
  if (!notesV3 && transcript) {
    validateTranscript(transcript);
  }

  return executeGenerator(part || "notes", { notesV3, transcript, goal, language, sourceMeta });
};

export default {
  extractVideoId,
  getTranscript,
  runInitialAnalysis,
  runLazyGeneration,
};
