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

// ─── Transcript fetch (youtube-transcript only, with resiliencies) ────────────
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

        return fullText;
      } catch (error) {
        lastError = error;

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
        `[TRANSCRIPT_RETRY] Attempt ${attempt}/${maxRetries} failed for video ${videoId}. Retrying in ${delay}ms... Error: ${lastError?.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `[TRANSCRIPT_FAILED] All ${maxRetries} attempts failed for video ${videoId}. Final error:`,
    lastError?.message,
  );
  throw new Error(`Transcript unavailable: ${lastError?.message || "unknown error"}`);
};

// ─── Initial analysis (Summary + KeyPoints) ────────────────────────────────────
export const runInitialAnalysis = async ({
  youtubeUrl,
  goal = "student",
  language = "english",
}) => {
  const transcript = await getTranscript(youtubeUrl, 3, language);
  const summary = await generateSummary({ transcript, goal, language });
  return { transcript, ...summary };
};

// ─── Lazy generation ───────────────────────────────────────────────────────────
// Returns the raw generator output.
// Normalization is done once by the caller (performLazyGeneration in controller).
export const runLazyGeneration = async ({
  transcript,
  goal = "student",
  language = "english",
  part,
  sourceMeta = {},
}) => {
  validateTranscript(transcript);

  return executeGenerator(part || "notes", { transcript, goal, language, sourceMeta });
};

export default {
  extractVideoId,
  getTranscript,
  runInitialAnalysis,
  runLazyGeneration,
};
