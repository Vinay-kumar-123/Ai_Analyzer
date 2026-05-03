import { Innertube } from "youtubei.js";

export const getVideoMeta = async (url) => {
  try {
    const videoId = extractVideoId(url);

    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);

    return {
      title: info.basic_info.title,
      duration: info.basic_info.duration, // seconds
      thumbnail: info.basic_info.thumbnail?.[0]?.url || "",
    };
  } catch (err) {
    console.error("❌ YouTube Meta Error:", err.message);
    throw new Error("Failed to fetch video metadata");
  }
};

// 🔥 helper
const extractVideoId = (url) => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
  );
  return match ? match[1] : null;
};