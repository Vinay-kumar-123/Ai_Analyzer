/**
 * ============================================================================
 * AI Learning OS
 * Transcript Resolver V2 — Optimized Production Edition
 * ----------------------------------------------------------------------------
 * Dedicated transcript extraction & resilience service.
 *
 * Fixed Production Behaviors:
 *   1. User-Request-Level Metrics: Metrics track actual user requests (bounded 0-100%).
 *      Language sub-attempts are NOT counted as independent user requests.
 *   2. CAPTCHA / 429 Short-Circuit: Language loop breaks immediately on CAPTCHA / 429.
 *      Prevents redundant requests on IP-level blocks (saves 66-75% HTTP traffic).
 *   3. Clean Provider Attempt Sequencing: Backoff + jitter runs once per provider attempt.
 *
 * ARCHITECTURE RULES:
 *   - Primary Provider: youtube-transcript
 *   - Pluggable Registry: BaseTranscriptProvider & TranscriptProviderRegistry
 *   - Data API v3: Diagnostic metadata ONLY (never provides transcript text)
 *   - Zero schema, prompt, worker, queue, or API response changes
 * ============================================================================
 */

import { YoutubeTranscript } from "youtube-transcript";

import {
  MAX_TRANSCRIPT_CHARS,
  MIN_TRANSCRIPT_CHARS,
  TRANSCRIPT_FETCH_TIMEOUT_MS,
  MESSAGES,
} from "../config/limits.js";

// ── Timeout Helper ────────────────────────────────────────────────────────────
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
// 1. PROVIDER INTERFACE & PRODUCTION HEALTH METRICS TRACKER
// ─────────────────────────────────────────────────────────────────────────────

export class ProviderHealthTracker {
  constructor(providerName) {
    this.providerName = providerName;
    this.totalRequests = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.captchaCount = 0;
    this.rateLimit429Count = 0;
    this.totalLatencyMs = 0;
    this.averageLatencyMs = 0;
    this.totalTranscriptChars = 0;
    this.averageTranscriptSizeChars = 0;
    this.retryAttemptsCount = 0;
    this.retrySuccessCount = 0;
    this.lastFailureReason = null;
    this.lastFailureTimestamp = null;
  }

  recordRequest() {
    this.totalRequests++;
  }

  recordRetryAttempt() {
    this.retryAttemptsCount++;
  }

  recordSuccess(latencyMs, transcriptLength, attemptsMade = 1) {
    this.successCount++;
    this.totalLatencyMs += latencyMs;
    this.averageLatencyMs = Math.round(this.totalLatencyMs / this.successCount);

    if (transcriptLength && typeof transcriptLength === "number") {
      this.totalTranscriptChars += transcriptLength;
      this.averageTranscriptSizeChars = Math.round(this.totalTranscriptChars / this.successCount);
    }

    if (attemptsMade > 1) {
      this.retrySuccessCount++;
    }
  }

  recordFailure(reason) {
    this.failureCount++;
    this.lastFailureReason = reason || "Unknown error";
    this.lastFailureTimestamp = new Date().toISOString();

    const lower = String(reason || "").toLowerCase();
    if (lower.includes("captcha") || lower.includes("bot")) {
      this.captchaCount++;
    }
    if (lower.includes("429") || lower.includes("too many requests") || lower.includes("rate")) {
      this.rateLimit429Count++;
    }
  }

  getMetrics() {
    const total = this.totalRequests || (this.successCount + this.failureCount) || 1;
    const retryTotal = this.retryAttemptsCount || 1;

    return {
      provider: this.providerName,
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      failureCount: this.failureCount,
      captchaCount: this.captchaCount,
      rateLimit429Count: this.rateLimit429Count,
      successRatePct: parseFloat(((this.successCount / total) * 100).toFixed(2)),
      failureRatePct: parseFloat(((this.failureCount / total) * 100).toFixed(2)),
      captchaRatePct: parseFloat(((this.captchaCount / total) * 100).toFixed(2)),
      rateLimit429RatePct: parseFloat(((this.rateLimit429Count / total) * 100).toFixed(2)),
      averageLatencyMs: this.averageLatencyMs,
      averageTranscriptSizeChars: this.averageTranscriptSizeChars,
      retryAttemptsCount: this.retryAttemptsCount,
      retrySuccessCount: this.retrySuccessCount,
      retrySuccessRatePct: parseFloat(((this.retrySuccessCount / retryTotal) * 100).toFixed(2)),
      lastFailureReason: this.lastFailureReason,
      lastFailureTimestamp: this.lastFailureTimestamp,
    };
  }
}

/**
 * Base Abstract Provider Class.
 */
export class BaseTranscriptProvider {
  constructor(name) {
    if (new.target === BaseTranscriptProvider) {
      throw new Error("BaseTranscriptProvider cannot be instantiated directly.");
    }
    this.name = name;
    this.healthTracker = new ProviderHealthTracker(name);
  }

  getName() {
    return this.name;
  }

  isConfigured() {
    return true;
  }

  isAvailable() {
    return this.isConfigured();
  }

  async fetch(videoId, options = {}) {
    throw new Error("fetch() must be implemented by transcript provider subclass.");
  }

  getMetrics() {
    return this.healthTracker.getMetrics();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRIMARY PROVIDER: YOUTUBE-TRANSCRIPT
// ─────────────────────────────────────────────────────────────────────────────

export class YoutubeTranscriptProvider extends BaseTranscriptProvider {
  constructor() {
    super("youtube-transcript");
  }

  /**
   * Executes ONE language candidate fetch without side-effecting request counts.
   */
  async fetch(videoId, { langConfig, attempt = 1, timeoutMs = TRANSCRIPT_FETCH_TIMEOUT_MS } = {}) {
    const fetchConfig = langConfig ? { lang: langConfig } : undefined;
    const langLabel   = langConfig || "auto";

    const snippets = await withTimeout(
      YoutubeTranscript.fetchTranscript(videoId, fetchConfig),
      timeoutMs,
      `youtube-transcript fetch (attempt ${attempt}, lang: ${langLabel})`,
    );

    if (!Array.isArray(snippets) || snippets.length === 0) {
      throw new Error("Transcript array empty");
    }

    const text = snippets
      .map((item) => (item.text || "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\[.*?\]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return { text, snippetCount: snippets.length, langUsed: langLabel };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PROVIDER REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export class TranscriptProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(provider) {
    if (!(provider instanceof BaseTranscriptProvider)) {
      throw new Error("Invalid provider — must extend BaseTranscriptProvider.");
    }
    this.providers.set(provider.getName(), provider);
  }

  getProvider(name) {
    return this.providers.get(name);
  }

  getAvailableProviders() {
    return Array.from(this.providers.values()).filter(
      (provider) => provider.isConfigured() && provider.isAvailable(),
    );
  }

  getAllMetrics() {
    return Array.from(this.providers.values()).map((p) => p.getMetrics());
  }
}

// Singleton Registry Instance
export const globalProviderRegistry = new TranscriptProviderRegistry();
globalProviderRegistry.register(new YoutubeTranscriptProvider());

// ─────────────────────────────────────────────────────────────────────────────
// 4. PURE UTILITIES & VALIDATORS
// ─────────────────────────────────────────────────────────────────────────────

export const validateVideoId = (videoId) => {
  if (!videoId || typeof videoId !== "string" || videoId.trim().length === 0) {
    throw new Error(MESSAGES.INVALID_URL);
  }
  return videoId.trim();
};

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

export const validateTranscriptText = (text) => {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error(MESSAGES.TRANSCRIPT_TOO_SHORT);
  }
  const len = text.trim().length;
  if (len < MIN_TRANSCRIPT_CHARS) throw new Error(MESSAGES.TRANSCRIPT_TOO_SHORT);
  if (len > MAX_TRANSCRIPT_CHARS) throw new Error(MESSAGES.TRANSCRIPT_TOO_LARGE);
};

export const fetchTranscriptAttempt = async (
  videoId,
  langConfig,
  attempt = 1,
  timeoutMs = TRANSCRIPT_FETCH_TIMEOUT_MS,
) => {
  const provider = globalProviderRegistry.getProvider("youtube-transcript");
  if (!provider) throw new Error("youtube-transcript provider not registered");
  return provider.fetch(videoId, { langConfig, attempt, timeoutMs });
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. DIAGNOSTIC METADATA LAYER (YouTube Data API v3)
// ─────────────────────────────────────────────────────────────────────────────

export const verifyVideoViaDataApi = async (videoId, analysisId = null) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const correlationTag = analysisId ? ` | analysisId: "${analysisId}"` : "";
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
        `[TRANSCRIPT:DIAGNOSTIC] | videoId: "${videoId}"${correlationTag}` +
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
      `[TRANSCRIPT:DIAGNOSTIC] | videoId: "${videoId}"${correlationTag}` +
      ` | failureReason: "${err.message}" | result: failed`,
    );
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. TWO-TIER FAILURE CLASSIFIER & CAPTCHA DETECTOR
// ─────────────────────────────────────────────────────────────────────────────

export const isCaptchaOrRateLimitError = (error) => {
  const lowerMsg = String(error?.message || "").toLowerCase();
  return (
    lowerMsg.includes("captcha") ||
    lowerMsg.includes("429") ||
    lowerMsg.includes("too many requests") ||
    lowerMsg.includes("bot") ||
    lowerMsg.includes("rate")
  );
};

/**
 * Detects permanent provider failures that must never be retried.
 *
 * Patterns are matched against the raw error message text thrown by
 * youtube-transcript (or any future provider). A match means the failure
 * is structural — no amount of retrying, language switching, or backoff
 * will produce a transcript for this video.
 *
 * Categories covered:
 *   - Captions / transcript explicitly disabled by the uploader
 *   - Video deleted, removed, or no longer available
 *   - Video set to private
 *   - Members-only content requiring channel membership
 *   - Age-restricted content requiring sign-in
 *
 * Pure function — no I/O, no side effects.
 */
export const isPermanentProviderError = (error) => {
  const lower = String(error?.message || "").toLowerCase();
  return (
    // ── Captions / transcript disabled ──────────────────────────────────────
    lower.includes("transcript is disabled")         ||
    lower.includes("transcripts are disabled")       ||
    lower.includes("subtitles are disabled")         ||
    lower.includes("no transcript is available")     ||
    lower.includes("no transcripts are available")   ||
    lower.includes("could not find any transcripts") ||
    lower.includes("captions are not available")     ||
    lower.includes("captions not available")         ||
    // ── Video state — permanently unavailable ───────────────────────────────
    lower.includes("video unavailable")              ||
    lower.includes("this video is unavailable")      ||
    lower.includes("video has been removed")         ||
    lower.includes("no longer available")            ||
    lower.includes("video is no longer")             ||
    // ── Access restrictions — private / members-only ────────────────────────
    lower.includes("private video")                  ||
    lower.includes("this video is private")          ||
    lower.includes("members only")                   ||
    lower.includes("members-only")                   ||
    lower.includes("join this channel")              ||
    // ── Age restriction ──────────────────────────────────────────────────────
    lower.includes("age-restricted")                 ||
    lower.includes("age restricted")                 ||
    lower.includes("confirm your age")               ||
    lower.includes("sign in to confirm your age")
  );
};

export const classifyFailure = (lastError, metadata) => {
  const errMsg = lastError?.message || "";

  // Permanent failure checks
  if (errMsg === MESSAGES.TRANSCRIPT_TOO_SHORT) {
    return { category: "content_too_short", isPermanent: true, userMessage: MESSAGES.TRANSCRIPT_TOO_SHORT };
  }
  if (errMsg === MESSAGES.TRANSCRIPT_TOO_LARGE) {
    return { category: "content_too_large", isPermanent: true, userMessage: MESSAGES.TRANSCRIPT_TOO_LARGE };
  }
  if (errMsg === MESSAGES.INVALID_URL) {
    return { category: "invalid_url", isPermanent: true, userMessage: MESSAGES.INVALID_URL };
  }

  // Provider-reported permanent failures (raw error text from youtube-transcript).
  // Checked here — before metadata — so the resolver fast-fails on the very first
  // attempt without waiting for all retries to exhaust.
  if (isPermanentProviderError(lastError)) {
    return {
      category:    "provider_permanent",
      isPermanent: true,
      userMessage: MESSAGES.VIDEO_UNAVAILABLE,
    };
  }

  // Diagnostic metadata checks (from YouTube Data API v3 — post-failure only)
  if (metadata) {
    if (!metadata.exists) {
      return { category: "video_unavailable", isPermanent: true, userMessage: MESSAGES.VIDEO_UNAVAILABLE };
    }
    if (!metadata.isPublic) {
      return { category: "video_private", isPermanent: true, userMessage: MESSAGES.VIDEO_UNAVAILABLE };
    }
    if (metadata.regionRestricted) {
      return { category: "region_blocked", isPermanent: true, userMessage: MESSAGES.VIDEO_UNAVAILABLE };
    }
  }

  // Temporary failure checks
  if (isCaptchaOrRateLimitError(lastError) ||
      errMsg.toLowerCase().includes("timed out") ||
      errMsg.toLowerCase().includes("network")   ||
      errMsg.toLowerCase().includes("econnreset")||
      errMsg.toLowerCase().includes("fetch failed")||
      errMsg.toLowerCase().includes("500")       ||
      errMsg.toLowerCase().includes("503")
  ) {
    return {
      category:    "provider_transient",
      isPermanent: false,
      userMessage: `Transcript temporarily unavailable — ${errMsg}`,
    };
  }

  return {
    category:    "unknown",
    isPermanent: false,
    userMessage: `Transcript unavailable: ${errMsg || "unknown error"}`,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. MAIN RESOLVER ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

export const resolveTranscript = async (
  videoId,
  { maxRetries = 3, targetLang = null, analysisId = null, registry = globalProviderRegistry } = {},
) => {
  const startTime       = Date.now();
  const validId         = validateVideoId(videoId);
  const langCandidates  = buildLanguageCandidates(targetLang);
  const availableProviders = registry.getAvailableProviders();

  const correlationTag  = analysisId ? ` | analysisId: "${analysisId}"` : "";

  console.log(
    `[TRANSCRIPT:START] | videoId: "${validId}"${correlationTag}` +
    ` | targetLang: "${targetLang || "auto"}" | candidates: ${JSON.stringify(langCandidates)}` +
    ` | availableProviders: [${availableProviders.map((p) => p.getName()).join(", ")}]` +
    ` | maxRetries: ${maxRetries}`,
  );

  if (availableProviders.length === 0) {
    const errorMsg = "No active transcript providers configured in registry";
    console.error(`[TRANSCRIPT:FAILED] | videoId: "${validId}"${correlationTag} | reason: "${errorMsg}"`);
    throw new Error(errorMsg);
  }

  let lastError;

  for (let providerIdx = 0; providerIdx < availableProviders.length; providerIdx++) {
    const provider = availableProviders[providerIdx];
    const providerName = provider.getName();
    
    // RECORD REQUEST EXACTLY ONCE PER USER REQUEST PER PROVIDER
    provider.healthTracker.recordRequest();

    if (providerIdx > 0) {
      console.warn(
        `[TRANSCRIPT:PROVIDER_SWITCH] | videoId: "${validId}"${correlationTag}` +
        ` | fromProvider: "${availableProviders[providerIdx - 1].getName()}"` +
        ` | toProvider: "${providerName}" | reason: "Primary provider exhausted"`,
      );
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const attemptStart = Date.now();
      let isBlockedByCaptchaOr429 = false;

      if (attempt > 1) {
        provider.healthTracker.recordRetryAttempt();
      }

      for (const langConfig of langCandidates) {
        const langLabel = langConfig || "auto";

        try {
          const result = await provider.fetch(validId, {
            langConfig,
            attempt,
            timeoutMs: TRANSCRIPT_FETCH_TIMEOUT_MS,
          });

          validateTranscriptText(result.text);

          const elapsedMs = Date.now() - startTime;

          // RECORD SUCCESS EXACTLY ONCE FOR THE USER REQUEST
          provider.healthTracker.recordSuccess(elapsedMs, result.text.length, attempt);

          console.log(
            `[TRANSCRIPT:SUCCESS] | videoId: "${validId}"${correlationTag}` +
            ` | provider: "${providerName}" | language: "${result.langUsed}"` +
            ` | attempt: ${attempt}/${maxRetries} | snippetCount: ${result.snippetCount}` +
            ` | transcriptLength: ${result.text.length} | elapsedMs: ${elapsedMs}`,
          );

          // Log provider health metrics
          console.log(
            `[TRANSCRIPT:METRICS]${correlationTag} | metrics: ${JSON.stringify(provider.getMetrics())}`,
          );

          return result.text;
        } catch (error) {
          lastError = error;
          const failure = classifyFailure(error, null);
          const elapsedMs = Date.now() - attemptStart;

          console.warn(
            `[TRANSCRIPT:ATTEMPT_FAILED] | videoId: "${validId}"${correlationTag}` +
            ` | provider: "${providerName}" | language: "${langLabel}"` +
            ` | attempt: ${attempt}/${maxRetries} | failureCategory: "${failure.category}"` +
            ` | isPermanent: ${failure.isPermanent} | failureReason: "${error?.message}"` +
            ` | elapsedMs: ${elapsedMs}`,
          );

          // PERMANENT FAILURE: Fast-fail immediately (no retries, no provider switch)
          if (failure.isPermanent) {
            provider.healthTracker.recordFailure(error?.message);

            console.error(
              `[TRANSCRIPT:PERMANENT_FAILURE] | videoId: "${validId}"${correlationTag}` +
              ` | provider: "${providerName}" | category: "${failure.category}"` +
              ` | failureReason: "${error?.message}" | totalElapsedMs: ${Date.now() - startTime}`,
            );
            throw new Error(failure.userMessage);
          }

          // CAPTCHA / 429 SHORT-CIRCUIT: Stop language candidate loop immediately!
          if (isCaptchaOrRateLimitError(error)) {
            console.warn(
              `[TRANSCRIPT:CAPTCHA_SHORT_CIRCUIT] | videoId: "${validId}"${correlationTag}` +
              ` | provider: "${providerName}" | language: "${langLabel}"` +
              ` | reason: "CAPTCHA/429 detected — stopping remaining language candidates for this attempt"`,
            );
            isBlockedByCaptchaOr429 = true;
            break; // Stop trying en, hi, etc.
          }
        }
      }

      // Exponential Backoff with Jitter for temporary failures before next provider attempt
      if (attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 500);
        const delay  = Math.min(1000 * Math.pow(2, attempt - 1) + jitter, 10_000);

        console.warn(
          `[TRANSCRIPT:RETRY] | videoId: "${validId}"${correlationTag}` +
          ` | provider: "${providerName}" | attempt: ${attempt}/${maxRetries}` +
          ` | retryDelayMs: ${delay} | failureReason: "${lastError?.message}"`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Record failure ONCE for this provider after all retries are exhausted
    provider.healthTracker.recordFailure(lastError?.message);

    console.log(
      `[TRANSCRIPT:METRICS]${correlationTag} | metrics: ${JSON.stringify(provider.getMetrics())}`,
    );
  }

  // ── All Providers & Retries Exhausted ───────────────────────────────────────
  console.warn(
    `[TRANSCRIPT:ALL_PROVIDERS_EXHAUSTED] | videoId: "${validId}"${correlationTag}` +
    ` | maxRetries: ${maxRetries} | lastError: "${lastError?.message}"` +
    ` | executing diagnostic metadata check...`,
  );

  const metadata = await verifyVideoViaDataApi(validId, analysisId);
  const failure  = classifyFailure(lastError, metadata);

  const diagnosticStr = metadata
    ? `exists=${metadata.exists} public=${metadata.isPublic}` +
      ` caption=${metadata.hasCaption} regionRestricted=${metadata.regionRestricted}` +
      ` defaultLang=${metadata.defaultLanguage || "unknown"} source=${metadata.source}`
    : "unavailable";

  console.error(
    `[TRANSCRIPT:FAILED] | videoId: "${validId}"${correlationTag}` +
    ` | finalResult: failed | category: "${failure.category}"` +
    ` | diagnostic: { ${diagnosticStr} }` +
    ` | failureReason: "${lastError?.message}"` +
    ` | totalElapsedMs: ${Date.now() - startTime}`,
  );

  throw new Error(failure.userMessage);
};

export default resolveTranscript;
