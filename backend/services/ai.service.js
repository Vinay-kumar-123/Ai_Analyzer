import { YoutubeTranscript } from "youtube-transcript";

import {
  MAX_TRANSCRIPT_CHARS,
  MIN_TRANSCRIPT_CHARS,
  TRANSCRIPT_FETCH_TIMEOUT_MS,
  MESSAGES,
} from "../config/limits.js";

import { generateSummary } from "../generators/summary.generator.js";
import { executeGenerator } from "../generators/generator.registry.js";
import { extractVideoId } from "../utils/youtubeMeta.js";

export { extractVideoId };

// ─── Timeout wrapper ───────────────────────────────────────────────────────────
const withTimeout = (promise, ms, label = "Operation") => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// ─── Transcript validation ─────────────────────────────────────────────────────
const validateTranscript = (transcript) => {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  const trimmed = transcript.trim();

  if (!trimmed) throw new Error("Transcript is empty.");
  if (trimmed.length < MIN_TRANSCRIPT_CHARS) throw new Error(MESSAGES.TRANSCRIPT_TOO_SHORT);
  if (trimmed.length > MAX_TRANSCRIPT_CHARS) throw new Error(MESSAGES.TRANSCRIPT_TOO_LARGE);
};

// ─── Transcript fetch (youtube-transcript only, with resiliencies & logging) ──
export const getTranscript = async (youtubeUrl, maxRetries = 3, targetLang = null) => {
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    throw new Error(MESSAGES.INVALID_URL);
  }

  let lastError;

  // Candidate language configurations for YoutubeTranscript
  const langConfigs = [
    undefined, // Default auto-detect
    targetLang ? targetLang.toLowerCase() : null,
    "en",
    "hi",
  ].filter((v, i, a) => v !== null && a.indexOf(v) === i);

  console.log(
    `[TRANSCRIPT_DISCOVERY] Extracting captions for videoId: "${videoId}" | Target lang: "${targetLang || "auto"}" | Candidate tracks: ${JSON.stringify(langConfigs)}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const langConfig of langConfigs) {
      try {
        const fetchConfig = langConfig ? { lang: langConfig } : undefined;

        const transcript = await withTimeout(
          YoutubeTranscript.fetchTranscript(videoId, fetchConfig),
          TRANSCRIPT_FETCH_TIMEOUT_MS,
          `Transcript fetch (attempt ${attempt}, lang: ${langConfig || "auto"})`,
        );

        if (!Array.isArray(transcript) || transcript.length === 0) {
          throw new Error("Transcript array empty");
        }

        const fullText = transcript
          .map((item) => (item.text || "").trim())
          .filter(Boolean)
          .join(" ")
          .replace(/\[.*?\]/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();

        validateTranscript(fullText);

        console.log(
          `[TRANSCRIPT_SUCCESS] Provider: youtube-transcript | Lang config: "${langConfig || "auto"}" | Snippet count: ${transcript.length} | Total length: ${fullText.length} chars`,
        );

        return fullText;
      } catch (error) {
        lastError = error;

        console.warn(
          `[TRANSCRIPT_TRACK_ERROR] Attempt ${attempt}/${maxRetries} | Lang: "${langConfig || "auto"}" failed for video "${videoId}": ${error?.message}`,
        );

        const nonRetryable =
          error?.message === MESSAGES.TRANSCRIPT_TOO_LARGE ||
          error?.message === MESSAGES.TRANSCRIPT_TOO_SHORT ||
          error?.message === MESSAGES.INVALID_URL;

        if (nonRetryable) throw error;
      }
    }

    if (attempt < maxRetries) {
      // Exponential backoff with random jitter (1s, 2s, 4s + jitter)
      const delay = Math.min(
        1000 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500),
        10000,
      );
      console.warn(
        `[TRANSCRIPT_RETRY] Attempt ${attempt}/${maxRetries} failed for video ${videoId}. Retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `[TRANSCRIPT_FAILED] All ${maxRetries} attempts failed for videoId: "${videoId}". Exact failure reason: ${lastError?.message}`,
  );
  throw new Error(`Transcript unavailable: ${lastError?.message || "unknown error"}`);
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
