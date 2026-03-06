import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { logger } from "./config/logger";
import { config } from "./config";
import { errorHandler } from "./middleware/error.middleware";
import { requestLogger } from "./middleware/logger.middleware";
import {
  generalRateLimiter,
  loginRateLimiter,
} from "./middleware/rateLimit.middleware";
import {
  schedulerService,
  initializeScheduledTasks,
} from "./services/scheduler.service";
import { apiRoutes } from "./routes";

const app: Application = express();

// Trust proxy (important for rate limiting and getting real IP behind proxies)
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting (skip in development when X-E2E header for E2E tests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    config.nodeEnv === "development" && req.headers["x-e2e"] === "true",
});

app.use("/api/", limiter);

// Specific rate limiting for auth endpoints (skip when X-E2E header in development)
app.use("/api/auth/login", (req, res, next) => {
  if (config.nodeEnv === "development" && req.headers["x-e2e"] === "true") {
    return next();
  }
  loginRateLimiter(req, res, next);
});
app.use("/api", generalRateLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API routes
app.get("/api", (_req: Request, res: Response) => {
  res.json({
    message: "RFQ Tendering Platform API",
    version: "1.0.0",
    documentation: "/api/docs",
  });
});

// Register API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
});

// Sentry error handler (must be before existing error handler)
Sentry.setupExpressErrorHandler(app);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize and start scheduled tasks
if (process.env.NODE_ENV !== "test") {
  initializeScheduledTasks();
  schedulerService.startAll();
}

// Graceful shutdown handler
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  schedulerService.stopAll();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  schedulerService.stopAll();
  process.exit(0);
});

// Unhandled rejection handler
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

export default app;
