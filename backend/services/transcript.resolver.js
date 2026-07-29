/**
 * ============================================================================
 * AI Learning OS
 * Transcript Resolver V2
 * ----------------------------------------------------------------------------
 * Dedicated transcript extraction service.
 *
 * Responsibilities:
 *   - Video ID validation
 *   - Language candidate construction
 *   - youtube-transcript fetch with per-attempt timeout
 *   - Transcript text validation
 *   - Post-failure metadata diagnostics via YouTube Data API v3 (diagnostic only)
 *   - Failure classification (internal — never written to DB or API response)
 *   - Structured production logging
 *
 * ARCHITECTURE RULES (do not violate):
 *   - youtube-transcript is the ONLY extraction library.
 *   - YouTube Data API v3 is called ONLY after all retries are exhausted.
 *   - Data API NEVER provides transcript content.
 *   - Data API result is advisory/diagnostic only — caption flag is NOT a hard gate.
 *   - No new public error codes, no schema changes, no API contract changes.
 * ============================================================================
 */

import { YoutubeTranscript } from "youtube-transcript";

import {
  MAX_TRANSCRIPT_CHARS,
  MIN_TRANSCRIPT_CHARS,
  TRANSCRIPT_FETCH_TIMEOUT_MS,
  MESSAGES,
} from "../config/limits.js";

// ─── Internal: timeout wrapper ────────────────────────────────────────────────
// Not exported — internal to this module only.
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. validateVideoId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asserts that videoId is a non-empty string.
 * Throws MESSAGES.INVALID_URL if invalid.
 *
 * Pure function — no side effects, no I/O.
 *
 * @param   {string|null|undefined} videoId
 * @returns {string}  The validated video ID
 */
export const validateVideoId = (videoId) => {
  if (!videoId || typeof videoId !== "string" || videoId.trim().length === 0) {
    throw new Error(MESSAGES.INVALID_URL);
  }
  return videoId.trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. buildLanguageCandidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the ordered, de-duplicated list of language configurations to try
 * with YoutubeTranscript.fetchTranscript().
 *
 * undefined → auto-detect (always first, highest priority)
 * targetLang → caller-requested language (if provided and not a duplicate)
 * "en" → English fallback
 * "hi" → Hindi fallback
 *
 * Pure function — no side effects, no I/O.
 *
 * @param   {string|null} targetLang
 * @returns {Array<string|undefined>}
 */
export const buildLanguageCandidates = (targetLang = null) => {
  const raw = [
    undefined,                                     // auto-detect (always first)
    targetLang ? targetLang.toLowerCase() : null,  // caller-requested lang
    "en",                                          // English fallback
    "hi",                                          // Hindi fallback
  ];

  const seen = new Set();
  return raw.filter((v) => {
    if (v === null) return false;
    const key = v === undefined ? "__auto__" : v;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. validateTranscriptText
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that the assembled transcript string meets length requirements.
 *
 * Throws MESSAGES.TRANSCRIPT_TOO_SHORT if below MIN_TRANSCRIPT_CHARS.
 * Throws MESSAGES.TRANSCRIPT_TOO_LARGE if above MAX_TRANSCRIPT_CHARS.
 *
 * Pure function — no side effects, no I/O.
 *
 * @param {string} text
 */
export const validateTranscriptText = (text) => {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error(MESSAGES.TRANSCRIPT_TOO_SHORT);
  }
  const len = text.trim().length;
  if (len < MIN_TRANSCRIPT_CHARS) throw new Error(MESSAGES.TRANSCRIPT_TOO_SHORT);
  if (len > MAX_TRANSCRIPT_CHARS) throw new Error(MESSAGES.TRANSCRIPT_TOO_LARGE);
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. fetchTranscriptAttempt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Performs a single youtube-transcript fetch for one language configuration.
 * Assembles the snippet array into a cleaned plain-text string.
 *
 * youtube-transcript is the ONLY extraction library used here.
 *
 * @param   {string}           videoId
 * @param   {string|undefined} langConfig   undefined = auto-detect
 * @param   {number}           attempt      1-based attempt counter (for logs)
 * @param   {number}           [timeoutMs]  Per-attempt timeout in ms
 * @returns {Promise<{ text: string, snippetCount: number, langUsed: string }>}
 */
export const fetchTranscriptAttempt = async (
  videoId,
  langConfig,
  attempt,
  timeoutMs = TRANSCRIPT_FETCH_TIMEOUT_MS,
) => {
  const fetchConfig = langConfig ? { lang: langConfig } : undefined;
  const langLabel   = langConfig || "auto";

  const snippets = await withTimeout(
    YoutubeTranscript.fetchTranscript(videoId, fetchConfig),
    timeoutMs,
    `Transcript fetch (attempt ${attempt}, lang: ${langLabel})`,
  );

  if (!Array.isArray(snippets) || snippets.length === 0) {
    throw new Error("Transcript array empty");
  }

  const text = snippets
    .map((item) => (item.text || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\[.*?\]/g, "")  // strip [Music], [Applause], etc.
    .replace(/\s{2,}/g, " ")
    .trim();

  return { text, snippetCount: snippets.length, langUsed: langLabel };
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. verifyVideoViaDataApi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls the YouTube Data API v3 for DIAGNOSTIC PURPOSES ONLY.
 *
 * IMPORTANT:
 *   - Called only AFTER all youtube-transcript retries are exhausted.
 *   - Never used as a transcript provider.
 *   - Never makes final business decisions alone.
 *   - caption flag is advisory; it is NOT treated as a definitive hard gate.
 *   - Returns null if YOUTUBE_API_KEY is not set or the request fails.
 *
 * @param   {string} videoId
 * @returns {Promise<{
 *   exists:           boolean,
 *   isPublic:         boolean,
 *   hasCaption:       boolean,
 *   defaultLanguage:  string|null,
 *   regionRestricted: boolean,
 *   source:           "youtube_data_api_v3"
 * }|null>}
 */
export const verifyVideoViaDataApi = async (videoId) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?id=${encodeURIComponent(videoId)}` +
      `&key=${apiKey}` +
      `&part=snippet,status,contentDetails`;

    const res = await withTimeout(
      fetch(url),
      8_000,
      "YouTube Data API v3 metadata diagnostic",
    );

    if (!res.ok) {
      console.warn(
        `[TRANSCRIPT] DATA_API_DIAGNOSTIC | videoId: "${videoId}"` +
        ` | httpStatus: ${res.status} | result: failed`,
      );
      return null;
    }

    const data = await res.json();
    const item = data?.items?.[0];

    if (!item) {
      return {
        exists:           false,
        isPublic:         false,
        hasCaption:       false,
        defaultLanguage:  null,
        regionRestricted: false,
        source:           "youtube_data_api_v3",
      };
    }

    const privacyStatus      = item.status?.privacyStatus || "unknown";
    const regionRestriction  = item.contentDetails?.regionRestriction;
    // caption=true means manual captions are present; false = auto-only or none
    // Treated as an ADVISORY HINT only — auto-captions may still succeed
    const hasCaption         = item.contentDetails?.caption === "true";
    const defaultLanguage    =
      item.snippet?.defaultAudioLanguage ||
      item.snippet?.defaultLanguage       ||
      null;

    return {
      exists:           true,
      isPublic:         privacyStatus === "public",
      hasCaption,
      defaultLanguage,
      regionRestricted: !!(
        regionRestriction?.blocked?.length > 0 ||
        (regionRestriction?.allowed && regionRestriction.allowed.length > 0)
      ),
      source: "youtube_data_api_v3",
    };
  } catch (err) {
    console.warn(
      `[TRANSCRIPT] DATA_API_DIAGNOSTIC | videoId: "${videoId}"` +
      ` | failureReason: "${err.message}" | result: failed`,
    );
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. classifyFailure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure function. Classifies the terminal failure after all retries are exhausted.
 *
 * CRITICAL RULES:
 *   - metadata is used as an ADVISORY hint only.
 *   - caption flag (hasCaption) is NOT a definitive gate — auto-captions may
 *     still be available even when hasCaption=false.
 *   - Returns only existing MESSAGES constants — no new public error codes.
 *   - The returned `category` is an internal label for logging only.
 *     It is never written to the database or API response.
 *
 * @param   {Error}  lastError
 * @param   {{
 *   exists:           boolean,
 *   isPublic:         boolean,
 *   hasCaption:       boolean,
 *   regionRestricted: boolean,
 * }|null}  metadata
 * @returns {{ category: string, userMessage: string }}
 */
export const classifyFailure = (lastError, metadata) => {
  const errMsg = lastError?.message || "";

  // Pass through non-retryable content errors unchanged (existing behavior)
  if (errMsg === MESSAGES.TRANSCRIPT_TOO_SHORT) {
    return { category: "content_too_short", userMessage: MESSAGES.TRANSCRIPT_TOO_SHORT };
  }
  if (errMsg === MESSAGES.TRANSCRIPT_TOO_LARGE) {
    return { category: "content_too_large", userMessage: MESSAGES.TRANSCRIPT_TOO_LARGE };
  }

  // Use metadata as ADVISORY hint for better user messages
  if (metadata) {
    if (!metadata.exists) {
      return { category: "video_unavailable", userMessage: MESSAGES.VIDEO_UNAVAILABLE };
    }
    if (!metadata.isPublic) {
      return { category: "video_private", userMessage: MESSAGES.VIDEO_UNAVAILABLE };
    }
    if (metadata.regionRestricted) {
      // VIDEO_UNAVAILABLE reused — no new public message constant added
      return { category: "region_blocked", userMessage: MESSAGES.VIDEO_UNAVAILABLE };
    }
    // hasCaption=false is advisory ONLY — auto-captions may still exist
    // We do NOT hard-fail based solely on this flag
  }

  // Transient provider error patterns (rate-limit, network, timeout)
  // Worker's isNonRetryable() will NOT match these — BullMQ will re-queue the job
  if (
    errMsg.toLowerCase().includes("timed out")         ||
    errMsg.toLowerCase().includes("too many requests") ||
    errMsg.toLowerCase().includes("rate")              ||
    errMsg.toLowerCase().includes("network")           ||
    errMsg.toLowerCase().includes("econnreset")        ||
    errMsg.toLowerCase().includes("fetch failed")
  ) {
    return {
      category:    "provider_transient",
      userMessage: `Transcript temporarily unavailable — ${errMsg}`,
    };
  }

  // Catch-all — preserves original error message shape
  return {
    category:    "unknown",
    userMessage: `Transcript unavailable: ${errMsg || "unknown error"}`,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. resolveTranscript  (main orchestrator)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates transcript extraction for a pre-validated YouTube video ID.
 *
 * Algorithm:
 *   1. Build language candidates (auto, targetLang, en, hi)
 *   2. For attempt 1..maxRetries:
 *      a. Try each language candidate via fetchTranscriptAttempt()
 *      b. On success → validateTranscriptText → return text
 *      c. On non-retryable error → re-throw immediately
 *      d. On other error → log warning, try next candidate
 *   3. Between attempts: exponential backoff + random jitter (1s → 2s → 4s, max 10s)
 *   4. After all retries exhausted:
 *      a. Call verifyVideoViaDataApi() — diagnostic ONLY
 *      b. classifyFailure() → get user message
 *      c. Log structured failure fields
 *      d. Throw with user-facing message
 *
 * @param   {string} videoId    Pre-validated YouTube video ID (11 chars)
 * @param   {{ maxRetries?: number, targetLang?: string|null }} opts
 * @returns {Promise<string>}   Cleaned transcript text
 */
export const resolveTranscript = async (
  videoId,
  { maxRetries = 3, targetLang = null } = {},
) => {
  const startTime      = Date.now();
  const langCandidates = buildLanguageCandidates(targetLang);

  console.log(
    `[TRANSCRIPT] START | videoId: "${videoId}" | provider: youtube-transcript` +
    ` | targetLang: "${targetLang || "auto"}" | candidates: ${JSON.stringify(langCandidates)}` +
    ` | maxRetries: ${maxRetries}`,
  );

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptStart = Date.now();

    for (const langConfig of langCandidates) {
      const langLabel = langConfig || "auto";

      try {
        const result = await fetchTranscriptAttempt(
          videoId,
          langConfig,
          attempt,
          TRANSCRIPT_FETCH_TIMEOUT_MS,
        );

        validateTranscriptText(result.text);

        const elapsedMs = Date.now() - startTime;
        console.log(
          `[TRANSCRIPT] SUCCESS | videoId: "${videoId}" | provider: youtube-transcript` +
          ` | language: "${result.langUsed}" | attempt: ${attempt}/${maxRetries}` +
          ` | snippetCount: ${result.snippetCount} | transcriptLength: ${result.text.length}` +
          ` | elapsedMs: ${elapsedMs} | finalResult: success`,
        );

        return result.text;

      } catch (error) {
        lastError = error;

        const nonRetryable =
          error?.message === MESSAGES.TRANSCRIPT_TOO_LARGE ||
          error?.message === MESSAGES.TRANSCRIPT_TOO_SHORT ||
          error?.message === MESSAGES.INVALID_URL;

        const elapsedMs = Date.now() - attemptStart;
        console.warn(
          `[TRANSCRIPT] ATTEMPT_FAILED | videoId: "${videoId}" | provider: youtube-transcript` +
          ` | language: "${langLabel}" | attempt: ${attempt}/${maxRetries}` +
          ` | failureReason: "${error?.message}" | elapsedMs: ${elapsedMs}` +
          ` | nonRetryable: ${nonRetryable}`,
        );

        if (nonRetryable) throw error;
      }
    }

    // All language candidates exhausted for this attempt — backoff before next
    if (attempt < maxRetries) {
      const delay = Math.min(
        1000 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500),
        10_000,
      );
      console.warn(
        `[TRANSCRIPT] RETRY | videoId: "${videoId}" | provider: youtube-transcript` +
        ` | attempt: ${attempt}/${maxRetries} | retryDelay: ${delay}ms` +
        ` | failureReason: "${lastError?.message}"`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // ── All retries exhausted ────────────────────────────────────────────────────
  console.warn(
    `[TRANSCRIPT] ALL_RETRIES_EXHAUSTED | videoId: "${videoId}"` +
    ` | maxRetries: ${maxRetries} | lastError: "${lastError?.message}"` +
    ` | running Data API diagnostic (advisory only)...`,
  );

  // Data API is called ONCE after all retries fail — diagnostic only
  const metadata = await verifyVideoViaDataApi(videoId);

  const metadataStatus = metadata
    ? `exists=${metadata.exists} public=${metadata.isPublic}` +
      ` caption=${metadata.hasCaption} regionRestricted=${metadata.regionRestricted}` +
      ` defaultLang=${metadata.defaultLanguage || "unknown"} source=${metadata.source}`
    : "unavailable (YOUTUBE_API_KEY not set or request failed)";

  const failure        = classifyFailure(lastError, metadata);
  const totalElapsedMs = Date.now() - startTime;

  console.error(
    `[TRANSCRIPT] FAILED | videoId: "${videoId}" | provider: youtube-transcript` +
    ` | finalResult: failed | category: "${failure.category}"` +
    ` | metadataStatus: { ${metadataStatus} }` +
    ` | failureReason: "${lastError?.message}"` +
    ` | totalElapsedMs: ${totalElapsedMs}`,
  );

  throw new Error(failure.userMessage);
};

export default resolveTranscript;
