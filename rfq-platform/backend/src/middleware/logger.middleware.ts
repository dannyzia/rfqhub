import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

// Extend Express Request to include start time
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Record start time
  req.startTime = Date.now();

  // Log request
  logger.info("Incoming request", {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to log response
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    // Calculate response time
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;

    // Log response
    logger.info("Outgoing response", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
    });

    // Call the original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

// Morgan-style request logger (alternative/additional option)
export const morganLogger = (
  tokens: any,
  req: Request,
  res: Response,
): string => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, "content-length"),
    "-",
    tokens["response-time"](req, res),
    "ms",
  ].join(" ");
};
