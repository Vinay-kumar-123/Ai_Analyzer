/**
 * FILE: frontend/components/VideoDurationWarning.jsx
 *
 * WHY THIS IS A SEPARATE COMPONENT:
 * Duration errors need to be displayed in two places:
 *   1. On the video submission form (before analysis is created)
 *   2. On the analysis result page (FailedScreen) if the job somehow
 *      reached the worker and was rejected there
 *
 * Having a single component guarantees consistent UX messaging,
 * consistent styling, and consistent behavior across both surfaces.
 *
 * WHAT IT RENDERS:
 * - When errorCode === "VIDEO_TOO_LONG": shows the premium duration
 *   warning with the actual video duration, the 4-hour limit, and
 *   actionable suggestions
 * - For all other errors: shows a generic clean error card
 * - When preview data is available with a valid video: shows the
 *   video info card (title, thumbnail, duration, credit cost)
 *
 * PRODUCTION-SAFE BECAUSE:
 * - Pure presentational component — no state, no side effects
 * - All text comes from MESSAGES (shared config) or props — no hardcoded strings
 * - Gracefully handles undefined/null props
 * - Uses Tailwind utility classes only (no custom CSS)
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiAlertTriangle, FiCheckCircle, FiInfo, FiZap } from "react-icons/fi";
import { MAX_VIDEO_DURATION_LABEL } from "@/config/limits";

// ─── DURATION DISPLAY HELPER ─────────────────────────────────────────────────
// Converts raw seconds to a friendly human string.
// Duplicated from the backend formatDuration helper — kept here so the
// component works without a network call when rendering from local state.

const formatDuration = (seconds) => {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
};

// ─── VIDEO TOO LONG WARNING ───────────────────────────────────────────────────

const VideoTooLongWarning = ({ videoDuration, durationFormatted }) => {
  const label = durationFormatted || (videoDuration ? formatDuration(videoDuration) : "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1   }}
      exit={  { opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <FiClock className="text-amber-400 text-lg" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base leading-snug">
            Video too long for AI analysis
          </h3>
          <p className="text-amber-200/80 text-sm mt-1 leading-relaxed">
            To ensure premium AI quality and complete learning notes, videos must be
            under <strong className="text-amber-300">{MAX_VIDEO_DURATION_LABEL}</strong>.
          </p>
        </div>
      </div>

      {/* Duration display */}
      {label && (
        <div className="mt-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <FiClock className="text-amber-400 flex-shrink-0" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Video duration:</span>
            <span className="text-amber-300 font-semibold">{label}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-400">Limit:</span>
            <span className="text-amber-300 font-semibold">{MAX_VIDEO_DURATION_LABEL}</span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="mt-4 space-y-2">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
          What you can do
        </p>
        <ul className="space-y-1.5">
          {[
            "Find a chapter or section of this video (usually available as a separate upload)",
            "Look for a condensed version or summary video on the same topic",
            "Use the video's timestamps to find a specific part under 4 hours",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center mt-0.5 font-bold">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

// ─── GENERIC ERROR CARD ───────────────────────────────────────────────────────

const GenericErrorCard = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={  { opacity: 0, y: -4 }}
    transition={{ duration: 0.2 }}
    className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5"
  >
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
        <FiAlertTriangle className="text-red-400 text-lg" />
      </div>
      <div>
        <h3 className="text-white font-bold text-base">Unable to analyze video</h3>
        <p className="text-red-200/80 text-sm mt-1 leading-relaxed">
          {message || "Something went wrong. Please try again."}
        </p>
      </div>
    </div>
  </motion.div>
);

// ─── VIDEO PREVIEW CARD ───────────────────────────────────────────────────────
// Shown when validation succeeds and the video is within limits.

export const VideoPreviewCard = ({ preview }) => {
  if (!preview) return null;

  const { title, duration, durationFormatted, thumbnail, requiredCredits, canAnalyze, userCredits } = preview;
  const label = durationFormatted || formatDuration(duration);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={  { opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative w-full h-36 bg-black/40">
          <img
            src={thumbnail}
            alt={title || "Video thumbnail"}
            className="w-full h-full object-cover opacity-80"
          />
          {/* Duration badge */}
          {label && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-semibold">
              <FiClock className="text-xs" />
              {label}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        {title && (
          <p className="text-white text-sm font-semibold leading-snug line-clamp-2 mb-3">
            {title}
          </p>
        )}

        {/* Credit cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiZap className="text-indigo-400 text-sm" />
            <span className="text-gray-400 text-sm">
              Cost:{" "}
              <span className="text-white font-semibold">
                {requiredCredits} credit{requiredCredits !== 1 ? "s" : ""}
              </span>
            </span>
          </div>

          {canAnalyze ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
              <FiCheckCircle />
              Ready to analyze
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
              <FiInfo />
              Need {requiredCredits - userCredits} more credits
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

/**
 * VideoDurationWarning
 *
 * @param {Object}  props
 * @param {string}  props.error           — user-facing error message
 * @param {string}  props.errorCode       — machine-readable error code
 * @param {number}  [props.videoDuration] — raw seconds (for display in warning)
 * @param {string}  [props.durationFormatted] — pre-formatted string from server
 */
const VideoDurationWarning = ({ error, errorCode, videoDuration, durationFormatted }) => {
  if (!error) return null;

  return (
    <AnimatePresence mode="wait">
      {errorCode === "VIDEO_TOO_LONG" ? (
        <VideoTooLongWarning
          key="too-long"
          videoDuration={videoDuration}
          durationFormatted={durationFormatted}
        />
      ) : (
        <GenericErrorCard key="generic" message={error} />
      )}
    </AnimatePresence>
  );
};

export default VideoDurationWarning;
