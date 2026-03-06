import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Upstash Redis configuration with TLS support (mock in test environment)
const _redisMockStore = new Map<string, string>();

const redisClient =
  process.env.NODE_ENV === "test"
    ? ({
        // Mock Redis client for tests — stateful in-memory store so set/get/del work correctly
        on: () => {},
        disconnect: async () => {},
        get: async (key: string) => _redisMockStore.get(key) ?? null,
        set: async (key: string, value: string) => {
          _redisMockStore.set(key, value);
          return "OK";
        },
        setex: async (key: string, _ttl: number, value: string) => {
          _redisMockStore.set(key, value);
          return "OK";
        },
        del: async (key: string) => {
          const existed = _redisMockStore.has(key);
          _redisMockStore.delete(key);
          return existed ? 1 : 0;
        },
        exists: async (key: string) => (_redisMockStore.has(key) ? 1 : 0),
        flushdb: async () => {
          _redisMockStore.clear();
          return "OK";
        },
        flushall: async () => {
          _redisMockStore.clear();
          return "OK";
        },
        incr: async () => 1,
        decr: async () => -1,
        incrby: async () => 1,
        decrby: async () => -1,
        expire: async () => 1,
        ttl: async () => -1,
        keys: async () => [],
        mget: async () => [],
        mset: async () => "OK",
        hget: async () => null,
        hset: async () => 1,
        hdel: async () => 1,
        hgetall: async () => ({}),
        hkeys: async () => [],
        hvals: async () => [],
        hlen: async () => 0,
        hexists: async () => 0,
        lpush: async () => 1,
        rpush: async () => 1,
        lpop: async () => null,
        rpop: async () => null,
        lrange: async () => [],
        lindex: async () => null,
        llen: async () => 0,
        sadd: async () => 1,
        srem: async () => 1,
        smembers: async () => [],
        sismember: async () => 0,
        scard: async () => 0,
        zadd: async () => 1,
        zrem: async () => 1,
        zrange: async () => [],
        zscore: async () => null,
        zrank: async () => null,
        zcard: async () => 0,
        ping: async () => "PONG",
        quit: async () => "OK",
        connect: async () => {},
        select: async () => "OK",
      } as unknown as Redis)
    : new Redis(process.env.REDIS_URL || "", {
        tls:
          process.env.NODE_ENV === "production"
            ? {}
            : { rejectUnauthorized: false }, // Enable TLS with verification in production, disable in non-production
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

// Connection event listeners (skip in test environment)
if (process.env.NODE_ENV !== "test") {
  redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully (Upstash)");
  });

  redisClient.on("error", (err: Error) => {
    console.error("❌ Redis connection error:", err.message);
    console.error("Make sure your REDIS_URL is set correctly in .env");
  });

  redisClient.on("reconnecting", () => {
    console.log("🔄 Reconnecting to Redis (Upstash)...");
  });

  redisClient.on("ready", () => {
    console.log("✅ Redis is ready to accept commands");
  });
}

export { redisClient };
export default redisClient;
