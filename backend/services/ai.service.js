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
import {
  safeString,
  safeStringArray,
  normalizeOutput as sharedNormalizeOutput,
} from "./shared/normalizers.js";

export { extractVideoId };
export { safeString, safeStringArray } from "./shared/normalizers.js";

const withTimeout = (promise, ms, label = "Operation") => {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
};

const validateTranscript = (transcript) => {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  const trimmed = transcript.trim();

  if (!trimmed) {
    throw new Error("Transcript is empty.");
  }

  if (trimmed.length < MIN_TRANSCRIPT_CHARS) {
    throw new Error(MESSAGES.TRANSCRIPT_TOO_SHORT);
  }

  if (trimmed.length > MAX_TRANSCRIPT_CHARS) {
    throw new Error(MESSAGES.TRANSCRIPT_TOO_LARGE);
  }
};

export const getTranscript = async (youtubeUrl, maxRetries = 3) => {
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    throw new Error(MESSAGES.INVALID_URL);
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transcript = await withTimeout(
        YoutubeTranscript.fetchTranscript(videoId),
        TRANSCRIPT_FETCH_TIMEOUT_MS,
        "Transcript fetch",
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

      if (nonRetryable) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        continue;
      }
    }
  }

  throw new Error(`Transcript unavailable: ${lastError?.message || "unknown error"}`);
};

export const runInitialAnalysis = async ({
  youtubeUrl,
  goal = "student",
  language = "english",
}) => {
  const transcript = await getTranscript(youtubeUrl);
  const summary = await generateSummary({
    transcript,
    goal,
    language,
  });

  return {
    transcript,
    ...normalizeOutput(summary),
  };
};

export const runLazyGeneration = async ({
  transcript,
  goal = "student",
  language = "english",
  type,
  memory,
  part,
}) => {
  validateTranscript(transcript);

  const generatorType = type || part || "notes";
  const generated = await executeGenerator(generatorType, {
    transcript,
    goal,
    language,
    memory,
  });

  return normalizeOutput(generated);
};

export const normalizeOutput = sharedNormalizeOutput;

export default {
  extractVideoId,
  getTranscript,
  runInitialAnalysis,
  runLazyGeneration,
  normalizeOutput,
  safeString,
  safeStringArray,
};
