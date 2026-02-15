import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthenticationError, AuthorizationError } from "./error.middleware";
import { pool } from "../config/database";
import { redisClient } from "../config/redis";
import { OrganizationType } from "../types/organization.types";

// Express Request type extension is defined in src/types/express.d.ts

interface JwtPayload {
  id?: string;
  userId?: number; // legacy
  email: string;
  role?: string;
  roles?: string[];
  organizationId?: string;
  organizationType?: OrganizationType;  // NEW
  companyId?: number;
}

// Extract token from Authorization header
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

// Verify JWT token
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError("No token provided");
    }

    // Check if token is blacklisted (for logout)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AuthenticationError("Token has been invalidated");
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Check if user still exists in database (schema: roles TEXT[], organization_id)
    const userId = decoded.id ?? decoded.userId;
    if (!userId) {
      throw new AuthenticationError("Invalid token payload");
    }
    const result = await pool.query(
      `SELECT u.id, u.email, u.roles, u.organization_id, u.is_active, o.organization_type
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError("User not found");
    }

    const user = result.rows[0];
    const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;

    if (!user.is_active) {
      throw new AuthenticationError("User account is inactive");
    }

    // Attach user to request
    req.user = {
      id: user.id.toString(),
      email: user.email,
      role: role ?? "vendor",
      roles: Array.isArray(user.roles) ? user.roles : [user.roles],
      companyId: user.organization_id?.toString() || user.id.toString(),
      orgId: user.organization_id?.toString() || user.id.toString(),
      organizationType: user.organization_type,  // NEW
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError("Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError("Token expired"));
    } else {
      next(error);
    }
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const userId = decoded.id ?? decoded.userId;
    const result = await pool.query(
      "SELECT id, email, roles, organization_id, is_active FROM users WHERE id = $1 AND is_active = true",
      [userId],
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
      req.user = {
        id: user.id.toString(),
        email: user.email,
        role: role ?? "vendor",
        roles: Array.isArray(user.roles) ? user.roles : [user.roles],
        companyId: user.organization_id?.toString(),
        orgId: user.organization_id?.toString() || user.id.toString(),
      };
    }

    next();
  } catch (error) {
    // Silently fail for optional authentication
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError("Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      );
    }

    next();
  };
};

// Check if user owns the resource
export const authorizeOwnership = (userIdField: string = "userId") => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError("Authentication required");
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];

    if (!resourceUserId) {
      throw new AuthorizationError("Resource ownership cannot be determined");
    }

    // Admin and super_admin can access any resource
    if (req.user.role === "admin" || req.user.role === "super_admin") {
      return next();
    }

    // Check ownership
    if (resourceUserId !== req.user.id) {
      throw new AuthorizationError(
        "You do not have permission to access this resource",
      );
    }

    next();
  };
};

// Check if user belongs to the same company
export const authorizeCompany = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError("Authentication required");
    }

    // Super admin can access all companies
    if (req.user.role === "super_admin") {
      return next();
    }

    const companyId = req.params.companyId || req.body.companyId;

    if (!companyId) {
      throw new AuthorizationError("Company ID required");
    }

    if (companyId !== req.user.companyId && companyId !== req.user.orgId) {
      throw new AuthorizationError(
        "You do not have permission to access this company",
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting for authenticated users (can be stored in Redis)
export const authenticatedRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const key = `rate_limit:${req.user.id}`;
    const limit = 1000; // requests per hour
    const window = 3600; // 1 hour in seconds

    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, window);
    }

    if (current > limit) {
      throw new AuthorizationError(
        "Rate limit exceeded for authenticated user",
      );
    }

    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, limit - current).toString(),
    );

    next();
  } catch (error) {
    next(error);
  }
};
