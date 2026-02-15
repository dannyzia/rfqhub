import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodEffects, ZodError } from "zod";
import { ValidationError } from "./error.middleware";

// Validation middleware factory
export const validate = (schema: AnyZodObject | ZodEffects<any>) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        const validationError = new ValidationError("Validation failed");

        // Attach detailed validation errors
        (validationError as any).details = errorMessages;

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

// Validate body only
export const validateBody = (schema: AnyZodObject) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        const validationError = new ValidationError(
          "Request body validation failed",
        );
        (validationError as any).details = errorMessages;

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

// Validate query parameters
export const validateQuery = (schema: AnyZodObject) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        const validationError = new ValidationError(
          "Query parameters validation failed",
        );
        (validationError as any).details = errorMessages;

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

// Validate URL parameters
export const validateParams = (schema: AnyZodObject) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        const validationError = new ValidationError(
          "URL parameters validation failed",
        );
        (validationError as any).details = errorMessages;

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};
