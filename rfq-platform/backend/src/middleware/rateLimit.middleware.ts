/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { redisClient, logger } from "../config";
import { config } from "../config";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

const defaultKeyGenerator = (req: Request): string => {
  return req.user?.id || req.ip || "anonymous";
};

export const createRateLimiter = (config: RateLimitConfig) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    message = "Too many requests, please try again later",
  } = config;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const windowSeconds = Math.ceil(windowMs / 1000);

      const current = await redisClient.incr(key);

      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - current),
      );

      const ttl = await redisClient.ttl(key);
      res.setHeader("X-RateLimit-Reset", Date.now() + ttl * 1000);

      if (current > maxRequests) {
        logger.warn("Rate limit exceeded", { key, current, maxRequests });

        // Add Retry-After header (required by HTTP spec)
        res.setHeader("Retry-After", ttl);
        
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMITED",
            message,
            retryAfter: ttl,
            retryAfterSeconds: ttl,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // If Redis fails, allow the request but log the error
      logger.error("Rate limiter error", { error });
      next();
    }
  };
};

// Pre-configured rate limiters

// General API rate limiter: Very lenient in development
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: config.nodeEnv === 'development' ? 10000 : 200, // 10k/min dev, 200/min prod
  message: "Too many requests. Please wait before making more requests.",
});

// Login rate limiter: Very lenient in development, strict in production
export const loginRateLimiter = createRateLimiter({
  windowMs: config.nodeEnv === 'development' ? 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
  maxRequests: config.nodeEnv === 'development' ? 1000 : 10, // 1000/min dev, 10/15min prod
  keyGenerator: (req) => `login:${req.ip}`,
  message: "Too many login attempts. Please try again later.",
});

// Bid submission rate limiter: 5 requests per 10 seconds per vendor org
export const bidSubmissionRateLimiter = createRateLimiter({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 5,
  keyGenerator: (req) => `bid_submit:${req.user?.orgId || req.ip}`,
  message:
    "Too many bid submissions. Please wait a moment before trying again.",
});

// Export rate limiter: 10 exports per hour per user
export const exportRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: "Export limit reached. Please wait before requesting more exports.",
});

// Strict rate limiter for sensitive operations: 3 requests per minute
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3,
  message: "Please wait before performing this action again.",
});
