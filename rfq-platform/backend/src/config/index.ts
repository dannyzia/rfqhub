import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration object
export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:5173",
    "http://localhost:3000",
  ],

  // Neon PostgreSQL Database
  database: {
    // Primary: Use connection string (recommended for Neon)
    connectionString: process.env.DATABASE_URL,

    // Alternative: Individual parameters
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL !== "false", // Default true for Neon
    max: parseInt(process.env.DB_POOL_SIZE || "20", 10),
  },

  // Upstash Redis
  redis: {
    // Primary: Use connection string (recommended for Upstash)
    url: process.env.REDIS_URL,

    // Alternative: Individual parameters
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "your-refresh-secret-key-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // Email (SMTP)
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.EMAIL_FROM || "noreply@rfqplatform.com",
  },

  // File Storage (S3/MinIO)
  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
    secretKey: process.env.S3_SECRET_KEY || "minioadmin",
    bucket: process.env.S3_BUCKET || "rfq-documents",
    region: process.env.S3_REGION || "us-east-1",
  },

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || "debug",
};

// Re-export connection instances
export { pool } from "./database";
export { redisClient } from "./redis";
export { logger } from "./logger";
