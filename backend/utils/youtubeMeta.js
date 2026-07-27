// ======================================================
// youtubeMeta.js
// Multi-Tier YouTube Video Metadata Resolver
//
// Tier 1: Official YouTube Data API v3 (when YOUTUBE_API_KEY is configured)
// Tier 2: YouTube oEmbed API + HTML Duration Extraction
// Tier 3: youtubei.js (Innertube) Fallback
// ======================================================

import { Innertube } from "youtubei.js";

let _innertube = null;

const getInnertube = async () => {
  if (_innertube) return _innertube;
  _innertube = await Innertube.create({
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

// Parse ISO 8601 Duration string (e.g. PT1H2M10S -> 3730)
const parseIsoDuration = (isoString) => {
  if (!isoString || typeof isoString !== "string") return 0;
  const match = isoString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
};

// ======================================================
// TIER 1: OFFICIAL YOUTUBE DATA API V3
// ======================================================
const fetchMetaViaDataApi = async (videoId) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`;
    const res = await fetch(apiUrl);
    if (!res.ok) return null;

    const data = await res.json();
    const item = data?.items?.[0];
    if (!item) return null;

    const title = item.snippet?.title || "";
    const thumbnails = item.snippet?.thumbnails || {};
    const thumbnail =
      thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      "";
    const duration = parseIsoDuration(item.contentDetails?.duration);

    if (title && duration > 0) {
      return { title, duration, thumbnail, source: "youtube_data_api_v3" };
    }
  } catch (err) {
    console.warn(`[YOUTUBE_META] Tier 1 Data API v3 failed for ${videoId}:`, err.message);
  }
  return null;
};

// ======================================================
// TIER 2: YOUTUBE OEMBED + HTML DURATION FALLBACK
// ======================================================
const fetchDurationFromHtml = async (videoId) => {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return 0;
    const html = await res.text();

    // Check "lengthSeconds":"123"
    const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
    if (lengthMatch && lengthMatch[1]) {
      return parseInt(lengthMatch[1], 10);
    }

    // Check itemprop="duration" content="PT15M33S"
    const isoMatch = html.match(/itemprop="duration"\s+content="([^"]+)"/);
    if (isoMatch && isoMatch[1]) {
      return parseIsoDuration(isoMatch[1]);
    }
  } catch (err) {
    console.warn(`[YOUTUBE_META] HTML duration parse failed for ${videoId}:`, err.message);
  }
  return 0;
};

const fetchMetaViaOembed = async (videoId) => {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;

    const data = await res.json();
    const title = data.title || "";
    const thumbnail = data.thumbnail_url || "";

    const duration = await fetchDurationFromHtml(videoId);

    if (title && duration > 0) {
      return { title, duration, thumbnail, source: "youtube_oembed" };
    }
  } catch (err) {
    console.warn(`[YOUTUBE_META] Tier 2 oEmbed failed for ${videoId}:`, err.message);
  }
  return null;
};

// ======================================================
// TIER 3: YOUTUBEJS (INNERTUBE) FALLBACK
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
      return;
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

  console.warn = suppress;
  console.error = suppressError;

  try {
    return await fn();
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }
};

const fetchMetaViaYoutubeJS = async (videoId) => {
  return withSuppressedYoutubeJSWarnings(async () => {
    const yt = await getInnertube();
    const info = await yt.getBasicInfo(videoId);
    const basic = info?.basic_info;
    if (!basic) return null;

    const title = basic.title || "";
    const duration =
      typeof basic.duration === "number"
        ? Math.floor(basic.duration)
        : parseInt(basic.duration || "0", 10) || 0;
    const thumbnails = basic.thumbnail;
    const thumbnail =
      Array.isArray(thumbnails) && thumbnails.length > 0
        ? [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || thumbnails[0]?.url || ""
        : "";

    if (title && duration > 0) {
      return { title, duration, thumbnail, source: "youtubejs" };
    }
    return null;
  });
};

// ======================================================
// MAIN: GET VIDEO META
// Returns { title, duration (seconds), thumbnail (url) }
// ======================================================
export const getVideoMeta = async (youtubeUrl) => {
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    throw new Error("Invalid YouTube URL — could not extract video ID");
  }

  // Tier 1: YouTube Data API v3 (if YOUTUBE_API_KEY is configured)
  if (process.env.YOUTUBE_API_KEY) {
    const meta1 = await fetchMetaViaDataApi(videoId);
    if (meta1) return meta1;
  }

  // Tier 2: YouTube oEmbed + HTML Duration Fallback
  const meta2 = await fetchMetaViaOembed(videoId);
  if (meta2) return meta2;

  // Tier 3: youtubei.js Fallback
  try {
    const meta3 = await fetchMetaViaYoutubeJS(videoId);
    if (meta3) return meta3;
  } catch (err) {
    console.warn(`[YOUTUBE_META] Tier 3 youtubei.js failed for ${videoId}:`, err.message);
  }

  throw new Error("Could not retrieve video metadata from any provider");
};

export default getVideoMeta;