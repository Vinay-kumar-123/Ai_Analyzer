/**
 * FILE: frontend/hooks/useVideoValidation.js
 *
 * WHY THIS FILE EXISTS:
 * Without frontend validation, users paste a long video URL, click
 * "Analyze", wait for the server round-trip, and THEN see an error.
 * That's a bad experience — especially on mobile where round-trips
 * are slower.
 *
 * This hook:
 *   1. Validates the URL format immediately (no network needed)
 *   2. Calls the /preview endpoint to get video metadata + duration
 *   3. Checks the duration against MAX_VIDEO_DURATION_SECONDS
 *   4. Returns clean state for the UI to display the right message
 *
 * WHY THIS IS PRODUCTION-SAFE:
 * - Frontend validation is UX convenience, NOT a security gate.
 *   The backend validates independently. If someone bypasses the
 *   frontend, the controller and worker both reject the request.
 * - The preview endpoint is read-only — no side effects, no credits,
 *   no DB writes. Calling it is safe.
 * - MAX_VIDEO_DURATION_SECONDS imported from the shared config so
 *   the frontend and backend are always in sync. Changing the limit
 *   in config/limits.js automatically updates both.
 *
 * USAGE:
 *   const { validate, validating, preview, error, errorCode } = useVideoValidation();
 *   await validate(youtubeUrl);
 */

"use client";

import { useState, useCallback } from "react";

// Import shared limits so frontend and backend always agree
import {
  MAX_VIDEO_DURATION_SECONDS,
  MIN_VIDEO_DURATION_SECONDS,
  MESSAGES,
} from "@/config/limits";   // ← Next.js alias pointing to backend/config/limits.js
                             //   OR a frontend copy at frontend/config/limits.js
                             //   See implementation note at bottom of this file.

const API = process.env.NEXT_PUBLIC_API_URL;

// ── URL FORMAT VALIDATOR ─────────────────────────────────────────────────────
// Validates that the string looks like a YouTube URL before making any
// network calls. Prevents wasted round-trips for obviously invalid input.
// Does NOT make a network request.

const YOUTUBE_URL_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=[A-Za-z0-9_-]{11}/,
  /^https?:\/\/youtu\.be\/[A-Za-z0-9_-]{11}/,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[A-Za-z0-9_-]{11}/,
  /^https?:\/\/(www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]{11}/,
];

const isValidYouTubeUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return YOUTUBE_URL_PATTERNS.some((pattern) => pattern.test(url.trim()));
};

// ── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * @returns {Object}
 *   validate(url)  — async function, call on form submit or URL blur
 *   reset()        — clears all state (call when user clears the input)
 *   validating     — boolean, true while preview fetch is in flight
 *   preview        — { title, duration, durationFormatted, thumbnail, requiredCredits, canAnalyze }
 *   error          — user-facing error string or null
 *   errorCode      — machine-readable code (VIDEO_TOO_LONG, INVALID_URL, etc.) or null
 *   isValid        — true only when preview succeeded AND no errors
 */
export const useVideoValidation = () => {
  const [validating, setValidating] = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [error,      setError]      = useState(null);
  const [errorCode,  setErrorCode]  = useState(null);

  const reset = useCallback(() => {
    setValidating(false);
    setPreview(null);
    setError(null);
    setErrorCode(null);
  }, []);

  const validate = useCallback(async (url) => {
    // Clear previous state on every new validation attempt
    setPreview(null);
    setError(null);
    setErrorCode(null);

    // ── Step 1: URL format check (no network) ──────────
    if (!url || !url.trim()) {
      setError(MESSAGES.INVALID_URL);
      setErrorCode("INVALID_URL");
      return false;
    }

    if (!isValidYouTubeUrl(url)) {
      setError(MESSAGES.INVALID_URL);
      setErrorCode("INVALID_URL");
      return false;
    }

    // ── Step 2: Call /preview endpoint ─────────────────
    setValidating(true);

    try {
      const res = await fetch(
        `${API}/api/analyze/preview?url=${encodeURIComponent(url.trim())}`,
        { credentials: "include" }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        // Use the server's error message (already premium UX copy from MESSAGES)
        const msg  = json.message  || MESSAGES.VIDEO_UNAVAILABLE;
        const code = json.errorCode || "UNKNOWN";
        setError(msg);
        setErrorCode(code);
        setValidating(false);
        return false;
      }

      const video = json.video;

      // ── Step 3: Client-side duration guard ─────────
      // WHY THIS EXISTS EVEN THOUGH SERVER VALIDATES:
      // The preview endpoint validates duration and returns an error if
      // the video is too long. But we also check here as a safety net
      // for cases where the preview request succeeds but returns metadata
      // we can interpret ourselves. Belt-and-suspenders approach.
      if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
        setError(MESSAGES.VIDEO_TOO_LONG);
        setErrorCode("VIDEO_TOO_LONG");
        setValidating(false);
        return false;
      }

      if (video.duration > 0 && video.duration < MIN_VIDEO_DURATION_SECONDS) {
        setError(MESSAGES.VIDEO_TOO_SHORT);
        setErrorCode("VIDEO_TOO_SHORT");
        setValidating(false);
        return false;
      }

      // ── Step 4: Success ─────────────────────────────
      setPreview({
        title:             video.title             || "",
        duration:          video.duration          || 0,
        durationFormatted: video.durationFormatted || "",
        thumbnail:         video.thumbnail         || "",
        requiredCredits:   json.requiredCredits    || 1,
        userCredits:       json.userCredits        ?? 0,
        canAnalyze:        json.canAnalyze         ?? false,
      });

      setValidating(false);
      return true;

    } catch (networkErr) {
      // Network failure — could not reach the server
      setError("Unable to validate this video. Please check your connection and try again.");
      setErrorCode("NETWORK_ERROR");
      setValidating(false);
      return false;
    }
  }, []);

  const isValid = !error && !errorCode && !!preview;

  return {
    validate,
    reset,
    validating,
    preview,
    error,
    errorCode,
    isValid,
  };
};

/*
 * ─── IMPLEMENTATION NOTE: Importing shared constants in Next.js ──────────────
 *
 * config/limits.js uses only plain JS primitives (no Node.js APIs).
 * It's safe to import directly in Next.js client components.
 *
 * OPTION A — Symlink or path alias (recommended):
 *   In next.config.js:
 *     const path = require("path");
 *     module.exports = {
 *       webpack: (config) => {
 *         config.resolve.alias["@/config/limits"] =
 *           path.resolve(__dirname, "../backend/config/limits.js");
 *         return config;
 *       },
 *     };
 *
 * OPTION B — Copy the file to frontend/config/limits.js and keep
 *   both in sync. Less elegant but works without build config changes.
 *   Add a CI check that both files are identical.
 *
 * OPTION C — npm workspace / monorepo shared package:
 *   Move config/limits.js to packages/shared/limits.js and import
 *   @myapp/shared in both frontend and backend.
 *
 * For this implementation we use OPTION A as the default.
 * ─────────────────────────────────────────────────────────────────────────────
 */
