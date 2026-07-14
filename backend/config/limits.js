/**
 * FILE: backend/config/limits.js
 *
 * WHY THIS FILE EXISTS:
 * Before this file, MAX_VIDEO_DURATION was hardcoded in 3 separate places:
 *   - analyzeController.js (was 6 hours, wrong value)
 *   - ai_service.js (implicit — no hard cap on transcript)
 *   - analysis_worker.js (no check at all)
 *
 * That meant the backend could accept a video, the controller would pass it,
 * the worker would start processing, and THEN the AI pipeline would hit
 * OpenAI token limits and fail after burning 5+ minutes of worker time.
 *
 * This file is the SINGLE SOURCE OF TRUTH for all platform limits.
 * Every layer imports from here. Changing a value here changes it everywhere.
 *
 * PRODUCTION-SAFE BECAUSE:
 * - Pure constants, no side effects, safe to import anywhere
 * - Works in both Node.js (backend) and Next.js (frontend via next.config.js)
 * - Grouped by concern so future engineers know exactly where to look
 * - JSDoc comments explain the reasoning behind each limit value
 */

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO DURATION LIMITS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maximum allowed YouTube video duration in seconds.
 *
 * Set to 4 hours (14,400s) based on:
 * - A 4-hour video produces ~120,000-180,000 transcript characters
 * - That fits within our 3-tier AI pipeline without quality degradation
 * - Videos over 4 hours produce transcripts that cause GPT-4o TPM errors
 *   even after compression and section splitting
 * - Real educational content (courses, lectures, tutorials) almost never
 *   exceeds 4 hours; 5-10 hour videos are usually compilations or streams
 *   with repeated/filler content that destroys AI output quality
 *
 * WHY NOT 6 HOURS: The original 6-hour limit was theoretical. In practice,
 * 4+ hour videos caused consistent worker failures, token overflows, and
 * incomplete notes. 4 hours is the real safe ceiling for premium quality.
 */
export const MAX_VIDEO_DURATION_SECONDS = 4 * 60 * 60; // 14,400 seconds

/**
 * Human-readable max duration string for UX messages.
 * Keep in sync with MAX_VIDEO_DURATION_SECONDS.
 */
export const MAX_VIDEO_DURATION_LABEL = "4 hours";

/**
 * Minimum video duration in seconds.
 * Rejects videos under 30 seconds — they have no real learning content
 * and waste AI tokens producing trivial output.
 */
export const MIN_VIDEO_DURATION_SECONDS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// TRANSCRIPT CHARACTER LIMITS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maximum allowed transcript character count.
 *
 * Set to 180,000 characters based on:
 * - GPT-4o context window: 128K tokens (~512K chars, but we must leave
 *   room for the system prompt (~4K tokens) and output (12K tokens)
 * - Our 3-tier pipeline handles up to ~165K chars (3x COMPRESS_THRESHOLD)
 *   reliably through sectioning + synthesis
 * - 180K chars is a safety ceiling ~10% above our Tier 3 threshold
 * - A 4-hour video at normal speech pace produces ~140,000-170,000 chars
 * - Fast talkers or dense technical content can produce up to ~180,000
 *
 * WHY WE NEED THIS SEPARATELY FROM DURATION:
 * Duration is checked at API entry (before transcript fetch) using video
 * metadata. But some videos (e.g. dense coding tutorials, lectures read
 * from slides) produce far more transcript text per minute than others.
 * Transcript length check happens AFTER fetch, inside the AI service,
 * as a second safety layer.
 */
export const MAX_TRANSCRIPT_CHARS = 180_000;

/**
 * Minimum transcript character count.
 * Rejects transcripts too short to produce meaningful learning content.
 * Below ~500 chars: usually auto-captions of music, intros, or silent videos.
 */
export const MIN_TRANSCRIPT_CHARS = 80;

/**
 * Threshold for switching from direct AI call to compression-first approach.
 * Videos producing transcripts above this threshold enter Tier 2 processing.
 * ~55K chars ≈ ~14K GPT tokens, which with prompt overhead fills a single call.
 */
export const TRANSCRIPT_COMPRESS_THRESHOLD = 55_000;

/**
 * Threshold for switching to full section+synthesis pipeline (Tier 3).
 * 3x the compress threshold = ~165K chars.
 */
export const TRANSCRIPT_TIER3_THRESHOLD = TRANSCRIPT_COMPRESS_THRESHOLD * 3; // 165,000

// ─────────────────────────────────────────────────────────────────────────────
// USER USAGE LIMITS
// ─────────────────────────────────────────────────────────────────────────────

/** Max analyses per user per calendar day. */
export const MAX_DAILY_ANALYSES = 30;

/** Redis TTL for the daily counter (24 hours in seconds). */
export const DAILY_LIMIT_TTL_SECS = 86_400;

/** Age in milliseconds after which a stuck "queued" job is considered an orphan. */
export const ORPHAN_JOB_AGE_MS = 10 * 60 * 1_000; // 10 minutes

// ─────────────────────────────────────────────────────────────────────────────
// AI PIPELINE TIMEOUTS
// ─────────────────────────────────────────────────────────────────────────────

/** Timeout per individual OpenAI HTTP call in milliseconds. */
export const AI_CALL_TIMEOUT_MS = 120_000; // 2 minutes

/** Timeout for the entire AI pipeline per worker attempt. */
export const AI_PIPELINE_TIMEOUT_MS = 300_000; // 5 minutes

/** Timeout for a single transcript fetch attempt. */
export const TRANSCRIPT_FETCH_TIMEOUT_MS = 30_000; // 30 seconds

/** Redis TTL for cached transcripts in seconds. */
export const TRANSCRIPT_CACHE_TTL_SECS = 604_800; // 7 days

// ─────────────────────────────────────────────────────────────────────────────
// USER-FACING MESSAGES
//
// All user-visible error messages live here so they are:
//   1. Consistent across API responses and frontend UI
//   2. Premium-sounding (no technical jargon)
//   3. Easy to A/B test or update in one place
// ─────────────────────────────────────────────────────────────────────────────

export const MESSAGES = {
  VIDEO_TOO_LONG: `To ensure premium AI quality and complete learning notes, videos must be under ${MAX_VIDEO_DURATION_LABEL}. Please try a shorter video or a specific chapter/segment.`,

  VIDEO_TOO_SHORT: "This video is too short to generate meaningful learning content. Please try a video that's at least 30 seconds long.",

  TRANSCRIPT_TOO_LARGE: `This video's content is too dense for a single analysis. For the best learning experience, please try a shorter video or a specific chapter under ${MAX_VIDEO_DURATION_LABEL}.`,

  TRANSCRIPT_TOO_SHORT: "This video doesn't appear to have enough spoken content to generate learning notes. It may be a silent video, music, or auto-generated captions only.",

  VIDEO_UNAVAILABLE: "This video is unavailable or private. Please use a publicly accessible YouTube video.",

  INVALID_URL: "Please enter a valid YouTube video URL.",

  DAILY_LIMIT_REACHED: `You've reached today's analysis limit. Your limit resets at midnight. Upgrade to Pro for higher limits.`,

  INSUFFICIENT_CREDITS: (required, available) =>
    `You need ${required} credit${required !== 1 ? "s" : ""} for this video, but you have ${available}. Add more credits or upgrade your plan.`,

  PROCESSING_STARTED: "Your AI learning system is being built. This usually takes 1–3 minutes.",
};

// ─────────────────────────────────────────────────────────────────────────────
// FRONTEND-SAFE EXPORT
//
// Next.js can import this file directly in client components.
// No Node.js-specific APIs are used. All values are plain primitives.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_DURATION_LABEL,
  MIN_VIDEO_DURATION_SECONDS,
  MAX_TRANSCRIPT_CHARS,
  MIN_TRANSCRIPT_CHARS,
  TRANSCRIPT_COMPRESS_THRESHOLD,
  TRANSCRIPT_TIER3_THRESHOLD,
  MAX_DAILY_ANALYSES,
  DAILY_LIMIT_TTL_SECS,
  ORPHAN_JOB_AGE_MS,
  AI_CALL_TIMEOUT_MS,
  AI_PIPELINE_TIMEOUT_MS,
  TRANSCRIPT_FETCH_TIMEOUT_MS,
  TRANSCRIPT_CACHE_TTL_SECS,
  MESSAGES,
};
