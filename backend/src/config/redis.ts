import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Upstash Redis configuration with TLS support
const redisClient = new Redis(process.env.REDIS_URL || "", {
  tls: {
    rejectUnauthorized: false, // Required for Upstash
  },
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  // Upstash-specific settings
  enableReadyCheck: false,
  enableOfflineQueue: true,
  lazyConnect: false,
  connectTimeout: 10000, // Increased timeout for cloud connection
});

// Alternative configuration if using individual parameters instead of connection string
// const redisClient = new Redis({
//   host: process.env.REDIS_HOST,
//   port: parseInt(process.env.REDIS_PORT || "6379"),
//   password: process.env.REDIS_PASSWORD,
//   tls: {
//     rejectUnauthorized: false,
//   },
//   maxRetriesPerRequest: 3,
//   retryStrategy(times) {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
// });

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully (Upstash)");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
  console.error("Make sure your REDIS_URL is set correctly in .env");
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Reconnecting to Redis (Upstash)...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis is ready to accept commands");
});

export { redisClient };
export default redisClient;
