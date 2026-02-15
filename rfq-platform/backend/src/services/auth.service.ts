import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool, logger, config } from "../config";
import { OrganizationType } from "../types/organization.types";

interface UserRow {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  password_hash: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserWithOrg extends UserRow {
  organization_name?: string;
  organization_type?: OrganizationType;
}

interface TokenRow {
  id: string;
  user_id: string;
  token_type: string;
  expires_at: string;
  created_at: string;
}

export const authService = {
  async register(input: any): Promise<{
    user: UserRow;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password, firstName, lastName, role, companyName } = input;

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw Object.assign(new Error("User already exists"), {
        statusCode: 409,
        code: "CONFLICT",
      });
    }

    // Hash password using bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // Create organization first
    const orgType = role === 'buyer' ? 'buyer' : 'vendor';
    const orgResult = await pool.query(
      `INSERT INTO organizations (name, type) VALUES ($1, $2) RETURNING id`,
      [companyName, orgType]
    );
    const organizationId = orgResult.rows[0].id;

    // Create user with organization
    const fullName = `${firstName} ${lastName}`.trim();
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (
        organization_id, name, email, password_hash, roles
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [organizationId, fullName, email, passwordHash, [role]],
    );

    const user = rows[0];

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token
    await pool.query(
      `INSERT INTO user_tokens (
        id, user_id, token_type, expires_at
      ) VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [refreshToken, user.id, "refresh"],
    );

    logger.info(`User registered: ${user.id} (${user.email})`);
    return { user, accessToken, refreshToken };
  },

  async login(input: any): Promise<{
    user: UserWithOrg;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = input;

    const { rows } = await pool.query<UserWithOrg>(
      `SELECT 
        u.id, u.email, u.name, u.password_hash, u.roles, u.is_active, u.created_at, u.updated_at,
        u.organization_id,
        o.name as organization_name,
        o.organization_type
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = $1 AND u.is_active = true`,
      [email],
    );

    if (rows.length === 0) {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
        code: "UNAUTHORIZED",
      });
    }

    const user = rows[0];

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
        code: "UNAUTHORIZED",
      });
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token
    await pool.query(
      `INSERT INTO user_tokens (
        id, user_id, token_type, expires_at
      ) VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [refreshToken, user.id, "refresh"],
    );

    logger.info(`User logged in: ${user.id} (${user.email})`);
    return { user, accessToken, refreshToken };
  },

  async refreshToken(input: any): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { refreshToken } = input;

    const { rows } = await pool.query<UserRow & { token_id: string }>(
      `SELECT ut.id as token_id, u.* FROM user_tokens ut
       JOIN users u ON u.id = ut.user_id
       WHERE ut.id = $1 AND ut.token_type = 'refresh' AND ut.expires_at > NOW()`,
      [refreshToken],
    );

    if (rows.length === 0) {
      throw Object.assign(new Error("Invalid refresh token"), {
        statusCode: 401,
        code: "UNAUTHORIZED",
      });
    }

    const user = rows[0];

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken();

    // Store new refresh token and invalidate old one
    await pool.query(
      `UPDATE user_tokens SET expires_at = NOW() WHERE id = $1`,
      [refreshToken],
    );

    await pool.query(
      `INSERT INTO user_tokens (
        id, user_id, token_type, expires_at
      ) VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [newRefreshToken, user.id, "refresh"],
    );

    logger.info(`Token refreshed for user: ${user.id}`);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async forgotPassword(input: any): Promise<void> {
    const { email } = input;

    const { rows } = await pool.query<UserRow>(
      "SELECT id, email FROM users WHERE email = $1",
      [email],
    );

    if (rows.length === 0) {
      // Don't reveal if user exists or not
      return;
    }

    const user = rows[0];

    // Generate reset token
    const resetToken = uuidv4();

    // Store reset token
    await pool.query(
      `INSERT INTO user_tokens (
        id, user_id, token_type, expires_at
      ) VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
      [resetToken, user.id, "reset"],
    );

    // TODO: Send email with reset token
    logger.info(
      `Password reset requested for user: ${user.id} (${user.email})`,
    );
  },

  async resetPassword(input: any): Promise<{
    user: UserRow;
    accessToken: string;
    refreshToken: string;
  }> {
    const { token: resetToken, password: newPassword } = input;

    const { rows } = await pool.query<TokenRow>(
      `SELECT * FROM user_tokens 
       WHERE id = $1 AND token_type = 'reset' AND expires_at > NOW()`,
      [resetToken],
    );

    if (rows.length === 0) {
      throw Object.assign(new Error("Invalid or expired reset token"), {
        statusCode: 400,
        code: "BAD_REQUEST",
      });
    }

    const tokenData = rows[0];

    // Fetch full user data
    const userResult = await pool.query<UserRow>(
      "SELECT * FROM users WHERE id = $1",
      [tokenData.user_id],
    );

    if (userResult.rows.length === 0) {
      throw Object.assign(new Error("User not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    const user = userResult.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      user.id,
    ]);

    // Invalidate all tokens for this user
    await pool.query(
      "UPDATE user_tokens SET expires_at = NOW() WHERE user_id = $1",
      [user.id],
    );

    // Generate new tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    // Store new refresh token
    await pool.query(
      `INSERT INTO user_tokens (
        id, user_id, token_type, expires_at
      ) VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [refreshToken, user.id, "refresh"],
    );

    logger.info(`Password reset for user: ${user.id} (${user.email})`);
    return { user, accessToken, refreshToken };
  },

  async logout(refreshToken: string): Promise<void> {
    await pool.query(
      "UPDATE user_tokens SET expires_at = NOW() WHERE id = $1",
      [refreshToken],
    );
    logger.info(`User logged out with token: ${refreshToken}`);
  },

  async getMe(userId: string): Promise<{ id: string; name: string; email: string; roles: string[]; orgId: string; organizationName?: string; organizationType?: OrganizationType }> {
    const { rows } = await pool.query<{ id: string; name: string; email: string; roles: string[]; organization_id: string; organization_name: string | null; organization_type: OrganizationType | null }>(
      `SELECT u.id, u.name, u.email, u.roles, u.organization_id, o.name as organization_name, o.organization_type
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1`,
      [userId],
    );
    if (rows.length === 0) {
      throw Object.assign(new Error("User not found"), { statusCode: 404, code: "NOT_FOUND" });
    }
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      roles: Array.isArray(row.roles) ? row.roles : [row.roles],
      orgId: row.organization_id,
      organizationName: row.organization_name ?? undefined,
      organizationType: row.organization_type ?? undefined,
    };
  },

  generateAccessToken(user: UserWithOrg): string {
    if (!config.jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    const payload = {
      id: user.id,
      email: user.email,
      roles: user.roles,
      organizationId: user.organization_id,
      organizationType: user.organization_type,  // NEW
    };
    
    // Convert "15m" to 900 seconds (15 * 60)
    const expiresInSeconds = 15 * 60; // 15 minutes
    
    return jwt.sign(payload, config.jwtSecret, { expiresIn: expiresInSeconds });
  },

  generateRefreshToken(): string {
    return uuidv4();
  },
};

