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
  enableOfflineQueue: true,
  connectTimeout: 10000,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    console.log(`🔄 Redis reconnect attempt ${times}, delay ${delay}ms`);
    return delay;
  },
  commandTimeout: 5000,
  reconnectOnError: () => true,
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
  if (err.code === "ECONNREFUSED") {
    console.error("   Check if Redis is running and accessible at:", redisUrl);
  } else if (err.code === "EPIPE") {
    console.error("   Connection broken. Attempting to reconnect...");
  }
});

//
// ======================================================
// BULLMQ CONNECTION
// ======================================================
//

export const connection = {
  url: redisUrl,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
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