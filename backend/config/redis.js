import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is missing in .env");
}

//
// ======================================================
// REDIS CLIENT
// ======================================================
//

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

//
// ======================================================
// BULLMQ CONNECTION
// ======================================================
//

export const connection = {
  url: redisUrl,
};

//
// ======================================================
// GET REDIS CLIENT
// ======================================================
//

export const getRedisClient = () => {
  return redis;
};

export default redis;