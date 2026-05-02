import dotenv from "dotenv";
dotenv.config(); 
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("❌ REDIS_URL missing in .env");
}

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: {}, // 🔥 required for Upstash (rediss)
  enableReadyCheck: false, // 🔥 prevents connection issues
});

// Debug logs
connection.on("connect", () => {
  console.log("✅ Redis connected (Upstash)");
});

connection.on("error", (err) => {
  if (err.code !== "ECONNREFUSED") {
    console.error("❌ Redis error:", err.message);
  }
});