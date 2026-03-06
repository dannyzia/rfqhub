import { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  asyncHandler,
} from "../error.middleware";

jest.mock("../../config/logger");

describe("Error Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      path: "/api/test",
      method: "GET",
      ip: "127.0.0.1",
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("AppError class", () => {
    it("should create AppError with default status code", () => {
      const error = new AppError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it("should create AppError with custom status code", () => {
      const error = new AppError("Test error", 400);

      expect(error.statusCode).toBe(400);
    });

    it("should create AppError with code", () => {
      const error = new AppError("Test error", 400, "CUSTOM_CODE");

      expect(error.code).toBe("CUSTOM_CODE");
    });
  });

  describe("ValidationError class", () => {
    it("should create ValidationError with 400 status code", () => {
      const error = new ValidationError("Validation failed");

      expect(error.message).toBe("Validation failed");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("AuthenticationError class", () => {
    it("should create AuthenticationError with default message", () => {
      const error = new AuthenticationError();

      expect(error.message).toBe("Authentication required");
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("should create AuthenticationError with custom message", () => {
      const error = new AuthenticationError("Invalid credentials");

      expect(error.message).toBe("Invalid credentials");
    });
  });

  describe("AuthorizationError class", () => {
    it("should create AuthorizationError with default message", () => {
      const error = new AuthorizationError();

      expect(error.message).toBe("Insufficient permissions");
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("AUTHORIZATION_ERROR");
    });

    it("should create AuthorizationError with custom message", () => {
      const error = new AuthorizationError("Access denied");

      expect(error.message).toBe("Access denied");
    });
  });

  describe("NotFoundError class", () => {
    it("should create NotFoundError with default message", () => {
      const error = new NotFoundError();

      expect(error.message).toBe("Resource not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("should create NotFoundError with custom message", () => {
      const error = new NotFoundError("User not found");

      expect(error.message).toBe("User not found");
    });
  });

  describe("ConflictError class", () => {
    it("should create ConflictError with 409 status code", () => {
      const error = new ConflictError("Resource already exists");

      expect(error.message).toBe("Resource already exists");
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT_ERROR");
    });
  });

  describe("DatabaseError class", () => {
    it("should create DatabaseError with default message", () => {
      const error = new DatabaseError();

      expect(error.message).toBe("Database operation failed");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("DATABASE_ERROR");
    });

    it("should create DatabaseError with custom message", () => {
      const error = new DatabaseError("Connection timeout");

      expect(error.message).toBe("Connection timeout");
    });
  });

  describe("errorHandler middleware", () => {
    it("should handle AppError correctly", () => {
      const error = new ValidationError("Invalid input");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Invalid input",
            code: "VALIDATION_ERROR",
            statusCode: 400,
          }),
        }),
      );
    });

    it("should handle generic Error with default 500 status", () => {
      const error = new Error("Generic error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Internal Server Error",
            statusCode: 500,
          }),
        }),
      );
    });

    it("should handle JsonWebTokenError", () => {
      const error = new Error("jwt malformed");
      (error as any).name = "JsonWebTokenError";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Invalid token",
            code: "INVALID_TOKEN",
          }),
        }),
      );
    });

    it("should handle TokenExpiredError", () => {
      const error = new Error("jwt expired");
      (error as any).name = "TokenExpiredError";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Token expired",
            code: "TOKEN_EXPIRED",
          }),
        }),
      );
    });

    it("should handle unique constraint PostgreSQL error (23505)", () => {
      const error = new Error("Unique constraint violation");
      (error as any).code = "23505";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Resource already exists",
            code: "DUPLICATE_ENTRY",
          }),
        }),
      );
    });

    it("should handle foreign key constraint PostgreSQL error (23503)", () => {
      const error = new Error("Foreign key constraint violation");
      (error as any).code = "23503";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Referenced resource does not exist",
            code: "INVALID_REFERENCE",
          }),
        }),
      );
    });

    it("should handle not null constraint PostgreSQL error (23502)", () => {
      const error = new Error("Not null constraint violation");
      (error as any).code = "23502";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Required field is missing",
            code: "MISSING_REQUIRED_FIELD",
          }),
        }),
      );
    });

    it("should include error timestamp in response", () => {
      const error = new ValidationError("Test error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(response.error.timestamp).toBeDefined();
      expect(new Date(response.error.timestamp)).toBeInstanceOf(Date);
    });

    it("should include error path in response", () => {
      const error = new ValidationError("Test error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(response.error.path).toBe("/api/test");
    });

    it("should log operational errors", () => {
      const mockLogger = require("../../config/logger").logger;
      const error = new ValidationError("Test error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should log unexpected errors", () => {
      const mockLogger = require("../../config/logger").logger;
      const error = new Error("Unexpected error");
      (error as any).isOperational = false;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("asyncHandler wrapper", () => {
    it("should execute async route handler", async () => {
      const mockHandler = jest.fn(async (_req: Request, res: Response) => {
        res.json({ success: true });
      });

      const wrappedHandler = asyncHandler(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should catch async errors and pass to next middleware", async () => {
      const testError = new Error("Async error");
      const mockHandler = jest.fn(async () => {
        throw testError;
      });

      const wrappedHandler = asyncHandler(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Give the promise chain time to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it("should pass request, response, and next to handler", async () => {
      const mockHandler = jest.fn(
        async (_req: Request, _res: Response, _next: NextFunction) => {
          _res.json({ success: true });
        },
      );

      const wrappedHandler = asyncHandler(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });
  });
});
