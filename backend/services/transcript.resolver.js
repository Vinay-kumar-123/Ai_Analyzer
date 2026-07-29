/**
 * ============================================================================
 * AI Learning OS
 * Transcript Resolver V2 — Multi-Provider Enterprise Edition
 * ----------------------------------------------------------------------------
 * Dedicated transcript extraction & resilience service.
 *
 * Architecture & Features:
 *   - Provider Interface (`BaseTranscriptProvider`) with Circuit Breaker readiness
 *   - Provider Registry (`TranscriptProviderRegistry`) decoupling resolver from concrete providers
 *   - Provider Health Metrics (`ProviderHealthTracker`: successCount, failureCount, avgLatency, lastFailure)
 *   - Two-Tier Failure Classifier (`IS_PERMANENT` vs `IS_TEMPORARY`)
 *   - Exponential Backoff with Jitter for temporary failure retries
 *   - Diagnostic Metadata Layer via YouTube Data API v3 (post-failure advisory check)
 *   - Correlation ID (`analysisId`) tracing across all log lines
 *   - Strict backward compatibility for all public exports
 *
 * ARCHITECTURE RULES:
 *   - Primary Provider: youtube-transcript
 *   - Provider 2 Slot: Pluggable interface (ready for future paid/Whisper providers)
 *   - Data API v3: Diagnostic metadata ONLY (never provides transcript text)
 *   - No DB schema changes, no frontend changes, no API payload changes
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
// 1. PROVIDER INTERFACE & HEALTH METRICS TRACKER
// ─────────────────────────────────────────────────────────────────────────────

export class ProviderHealthTracker {
  constructor(providerName) {
    this.providerName = providerName;
    this.successCount = 0;
    this.failureCount = 0;
    this.totalLatencyMs = 0;
    this.averageLatencyMs = 0;
    this.lastFailureReason = null;
    this.lastFailureTimestamp = null;
  }

  recordSuccess(latencyMs) {
    this.successCount++;
    this.totalLatencyMs += latencyMs;
    this.averageLatencyMs = Math.round(this.totalLatencyMs / this.successCount);
  }

  recordFailure(reason) {
    this.failureCount++;
    this.lastFailureReason = reason || "Unknown error";
    this.lastFailureTimestamp = new Date().toISOString();
  }

  getMetrics() {
    return {
      provider: this.providerName,
      successCount: this.successCount,
      failureCount: this.failureCount,
      averageLatencyMs: this.averageLatencyMs,
      lastFailureReason: this.lastFailureReason,
      lastFailureTimestamp: this.lastFailureTimestamp,
    };
  }
}

/**
 * Base Abstract Provider Class.
 * All transcript extraction providers extend this base interface.
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
    return true; // Default to true unless environment keys are missing
  }

  /**
   * Circuit Breaker Compatibility Interface.
   * Returns true if provider is healthy and available to accept requests.
   */
  isAvailable() {
    return this.isConfigured();
  }

  /**
   * Abstract fetch method — must be implemented by subclasses.
   */
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

  async fetch(videoId, { langConfig, attempt = 1, timeoutMs = TRANSCRIPT_FETCH_TIMEOUT_MS } = {}) {
    const fetchConfig = langConfig ? { lang: langConfig } : undefined;
    const langLabel   = langConfig || "auto";
    const startMs     = Date.now();

    try {
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

      const elapsed = Date.now() - startMs;
      this.healthTracker.recordSuccess(elapsed);

      return { text, snippetCount: snippets.length, langUsed: langLabel };
    } catch (error) {
      this.healthTracker.recordFailure(error?.message);
      throw error;
    }
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
// 4. PURE UTILITIES & VALIDATORS (Preserved Export Signatures)
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

/**
 * Backward-compatible single fetch attempt function.
 * Wraps the primary registered provider.
 */
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
// 6. TWO-TIER FAILURE CLASSIFIER
// ─────────────────────────────────────────────────────────────────────────────

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

  // Diagnostic metadata checks
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

  // Temporary failure checks (rate limit, captcha, network, HTTP 429/5xx)
  const lowerMsg = errMsg.toLowerCase();
  if (
    lowerMsg.includes("timed out")         ||
    lowerMsg.includes("too many requests") ||
    lowerMsg.includes("rate")              ||
    lowerMsg.includes("network")           ||
    lowerMsg.includes("econnreset")        ||
    lowerMsg.includes("fetch failed")      ||
    lowerMsg.includes("captcha")           ||
    lowerMsg.includes("429")               ||
    lowerMsg.includes("500")               ||
    lowerMsg.includes("503")
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

    if (providerIdx > 0) {
      console.warn(
        `[TRANSCRIPT:PROVIDER_SWITCH] | videoId: "${validId}"${correlationTag}` +
        ` | fromProvider: "${availableProviders[providerIdx - 1].getName()}"` +
        ` | toProvider: "${providerName}" | reason: "Primary provider exhausted"`,
      );
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const attemptStart = Date.now();

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
          console.log(
            `[TRANSCRIPT:SUCCESS] | videoId: "${validId}"${correlationTag}` +
            ` | provider: "${providerName}" | language: "${result.langUsed}"` +
            ` | attempt: ${attempt}/${maxRetries} | snippetCount: ${result.snippetCount}` +
            ` | transcriptLength: ${result.text.length} | elapsedMs: ${elapsedMs}`,
          );

          // Log provider health metrics periodically
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
            console.error(
              `[TRANSCRIPT:FAILED] | videoId: "${validId}"${correlationTag}` +
              ` | provider: "${providerName}" | category: "${failure.category}"` +
              ` | isPermanent: true | totalElapsedMs: ${Date.now() - startTime}`,
            );
            throw new Error(failure.userMessage);
          }
        }
      }

      // Exponential Backoff with Jitter for temporary failures before next attempt
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
