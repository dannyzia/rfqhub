import dotenv from "dotenv";
import path from "path";

// Load .env.test BEFORE importing pool so DATABASE_URL is set when pg.Pool is created.
dotenv.config({ path: path.join(process.cwd(), ".env.test") });

import { Pool } from "pg";
import { pool } from "../src/config/database";
import { redisClient } from "../src/config/redis";

export default async () => {
  // Set connection limits for test environment
  if (pool) {
    // Reduce max connections for testing to prevent pool saturation
    const poolConfig = (pool as unknown) as Pool & { options: { max: number; idleTimeoutMillis: number; connectionTimeoutMillis: number } };
    poolConfig.options.max = 5;
    poolConfig.options.idleTimeoutMillis = 10000;
    poolConfig.options.connectionTimeoutMillis = 5000;
  }

  // Create test database schema
  try {
    await pool.query("CREATE SCHEMA IF NOT EXISTS test_schema");
    console.log("✅ Test schema ready");
  } catch (err: unknown) {
    // Non-fatal — schema may already exist or DB may not be available in unit-only runs
    console.warn(
      "⚠️  test_schema setup skipped:",
      err instanceof Error ? err.message : String(err),
    );
  }

  // Flush test Redis (it's a mock in test mode, so this is a no-op but safe)
  try {
    const redisClientWithFlush = (redisClient as unknown) as { flushdb?: () => Promise<string> };
    await redisClientWithFlush.flushdb?.();
  } catch {
    // Mock client may not implement flushdb — ignore
  }

  console.log("✅ Test environment initialized with connection limits");
};
