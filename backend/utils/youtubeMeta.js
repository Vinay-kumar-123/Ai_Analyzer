// ======================================================
// youtubeMeta.js
// Fetches YouTube video title, duration, and thumbnail.
//
// Uses youtube-transcript's underlying fetch for
// transcript and youtubei.js (via @distube/ytdl-core or
// a lightweight direct API call) for metadata.
//
// youtubei.js emits [YOUTUBEJS][Parser] warnings for
// new YouTube node types it doesn't recognise yet
// (e.g. HypeFanCreditsSectionView). These are harmless
// parser noise — they do NOT affect transcript or basic
// video metadata. We suppress them here and extract
// only what we need: title, duration, thumbnail.
// ======================================================

import { Innertube } from "youtubei.js";

// ======================================================
// INNERTUBE SINGLETON
// Creating a new Innertube per request is expensive.
// One shared instance is safe — it's stateless for
// public video metadata lookups.
// ======================================================

let _innertube = null;

const getInnertube = async () => {
  if (_innertube) return _innertube;
  _innertube = await Innertube.create({
    // Disable the visitor data / cookie flow — not needed
    // for public metadata. Reduces init noise.
    retrieve_player: false,
  });
  return _innertube;
};

// ======================================================
// EXTRACT VIDEO ID
// Handles all common YouTube URL formats:
//   https://www.youtube.com/watch?v=ID
//   https://youtu.be/ID
//   https://youtube.com/shorts/ID
//   https://www.youtube.com/embed/ID
// ======================================================

export const extractVideoId = (url) => {
  if (!url || typeof url !== "string") return null;

  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // ?v=ID or &v=ID
  const vMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  // /shorts/ID or /embed/ID or /v/ID
  const pathMatch = url.match(/\/(?:shorts|embed|v)\/([A-Za-z0-9_-]{11})/);
  if (pathMatch) return pathMatch[1];

  return null;
};

// ======================================================
// SILENCE YOUTUBEJS PARSER WARNINGS
//
// youtubei.js logs via console.warn for unknown parser
// nodes like HypeFanCreditsSectionView. These are:
//   1. Non-fatal — the library creates a stub class
//   2. Not related to transcript or basic info
//   3. Extremely noisy in production logs
//
// We patch console.warn temporarily during getVideoMeta
// to suppress only [YOUTUBEJS] prefixed messages.
// All other warnings pass through normally.
// ======================================================

const withSuppressedYoutubeJSWarnings = async (fn) => {
  const originalWarn = console.warn;
  const originalError = console.error;

  const suppress = (...args) => {
    const msg = String(args[0] || "");
    if (
      msg.includes("[YOUTUBEJS]") ||
      msg.includes("HypeFanCreditsSectionView") ||
      msg.includes("Unable to find matching run") ||
      msg.includes("InnertubeError") ||
      msg.includes("ParsingError") ||
      msg.includes("Type mismatch, got Hype")
    ) {
      return; // silently drop
    }
    originalWarn.apply(console, args);
  };

  const suppressError = (...args) => {
    const msg = String(args[0] || "");
    if (
      msg.includes("[YOUTUBEJS]") ||
      msg.includes("HypeFanCreditsSectionView") ||
      msg.includes("InnertubeError") ||
      msg.includes("ParsingError")
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn  = suppress;
  console.error = suppressError;

  try {
    return await fn();
  } finally {
    // Always restore — even on throw
    console.warn  = originalWarn;
    console.error = originalError;
  }
};

// ======================================================
// THUMBNAIL PICKER
// Returns the highest-resolution thumbnail available.
// ======================================================

const pickThumbnail = (thumbnails) => {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return "";

  // Sort by width descending, pick first
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || thumbnails[0]?.url || "";
};

// ======================================================
// PARSE DURATION
// youtubei.js returns duration in seconds as a number
// on basic_info. Normalise to always be a number.
// ======================================================

const parseDuration = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return Math.floor(value);
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

// ======================================================
// MAIN: GET VIDEO META
// Returns { title, duration (seconds), thumbnail (url) }
// Throws on invalid URL or unreachable video.
// ======================================================

export const getVideoMeta = async (youtubeUrl) => {
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    throw new Error("Invalid YouTube URL — could not extract video ID");
  }

  return withSuppressedYoutubeJSWarnings(async () => {
    let info;

    try {
      const yt = await getInnertube();
      info = await yt.getBasicInfo(videoId);
    } catch (err) {
      // If getBasicInfo itself throws (network, private video, etc.)
      // re-throw with a clean message
      throw new Error(`YouTube fetch failed: ${err.message}`);
    }

    const basic = info?.basic_info;

    if (!basic) {
      throw new Error("YouTube returned no video info — video may be private or deleted");
    }

    const title     = basic.title        || "";
    const duration  = parseDuration(basic.duration);
    const thumbnail = pickThumbnail(basic.thumbnail);

    if (!duration) {
      throw new Error("Video duration unavailable — may be a live stream or private video");
    }

    return { title, duration, thumbnail };
  });
};

export default getVideoMeta;