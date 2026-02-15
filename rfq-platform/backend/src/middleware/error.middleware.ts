import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { config } from "../config";

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT_ERROR");
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    stack?: string;
    details?: any;
  };
}

// Main error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let code = "INTERNAL_ERROR";
  let isOperational = false;

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || "APP_ERROR";
    isOperational = err.isOperational;
  }

  // Check for statusCode property on any error (for errors created with Object.assign)
  if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
    statusCode = (err as any).statusCode;
    isOperational = true;
  }

  // Check for code property on any error
  if ('code' in err && typeof (err as any).code === 'string' && !code.startsWith('INTERNAL_')) {
    code = (err as any).code;
  }

  // Handle specific known errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    isOperational = true;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    code = "INVALID_TOKEN";
    isOperational = true;
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    code = "TOKEN_EXPIRED";
    isOperational = true;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid data format";
    code = "INVALID_FORMAT";
    isOperational = true;
  }

  // PostgreSQL specific errors
  if ("code" in err) {
    const pgError = err as any;

    if (pgError.code === "23505") {
      // Unique violation
      statusCode = 409;
      message = "Resource already exists";
      code = "DUPLICATE_ENTRY";
      isOperational = true;
    }

    if (pgError.code === "23503") {
      // Foreign key violation
      statusCode = 400;
      message = "Referenced resource does not exist";
      code = "INVALID_REFERENCE";
      isOperational = true;
    }

    if (pgError.code === "23502") {
      // Not null violation
      statusCode = 400;
      message = "Required field is missing";
      code = "MISSING_REQUIRED_FIELD";
      isOperational = true;
    }
  }

  // Log error
  if (isOperational) {
    logger.warn("Operational error:", {
      message,
      code,
      statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.error("Unexpected error:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  // Include validation details if available
  if (err instanceof ValidationError && (err as any).details) {
    errorResponse.error.details = (err as any).details;
  }

  // Include stack trace in development
  if (config.nodeEnv === "development") {
    errorResponse.error.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
