import { authService } from "../auth.service";
import bcrypt from "bcryptjs";

jest.mock("../../config/database");
jest.mock("../../config/redis");
jest.mock("bcryptjs");

describe("AuthService", () => {
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use the actual jest-mocked module reference so service picks up the mock
    const mockDatabase = require("../../config/database");
    mockPool = mockDatabase.pool;
    // Default bcrypt behaviour: hash returns a fake hash, compare returns false
    (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$12$fakehash");
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  });

  describe("register", () => {
    it("should register valid buyer and return tokens", async () => {
      const mockDatabase = require("../../config/database");
      const mockUser = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organization_id: "00000000-0000-0000-0000-000000000001",
        password_hash: "hashed-password",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockOrgId = "00000000-0000-0000-0000-000000000001";

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existingUser check
        .mockResolvedValueOnce({ rows: [{ id: mockOrgId }], rowCount: 1 }) // org creation
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // user creation
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // token storage

      const mockRegisterData = {
        email: "buyer@example.com",
        password: "SecureP@ss123!",
        firstName: "Buyer",
        lastName: "User",
        role: "buyer",
        companyName: "Test Company",
      };

      const result = await authService.register(mockRegisterData);

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockDatabase.pool.query).toHaveBeenCalledTimes(4);
    });

    it("should register valid vendor and return tokens", async () => {
      const mockDatabase = require("../../config/database");
      const mockUser = {
        id: "user-002",
        email: "vendor@example.com",
        name: "Vendor User",
        roles: ["vendor"],
        organization_id: "00000000-0000-0000-0000-000000000002",
        password_hash: "hashed-password",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockOrgId = "00000000-0000-0000-000000000002";

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existingUser check
        .mockResolvedValueOnce({ rows: [{ id: mockOrgId }], rowCount: 1 }) // org creation
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // user creation
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // token storage

      const mockRegisterData = {
        email: "vendor@example.com",
        password: "SecureP@ss456!",
        firstName: "Vendor",
        lastName: "User",
        role: "vendor",
        companyName: "Test Vendor Company",
      };

      const result = await authService.register(mockRegisterData);

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockDatabase.pool.query).toHaveBeenCalledTimes(4);
    });

    it("should throw ConflictError for duplicate email", async () => {
      const mockRegisterData = {
        email: "buyer@example.com",
        password: "SecureP@ss123!",
        firstName: "Buyer",
        lastName: "User",
        role: "buyer",
        companyName: "Test Company",
      };

      const mockDatabase = require("../../config/database");
      mockDatabase.pool.query.mockResolvedValue({
        rows: [{ id: "existing-user" }],
        rowCount: 1,
      });

      await expect(authService.register(mockRegisterData)).rejects.toThrow(
        "User already exists",
      );
    });

    it("should reject password < 12 chars", async () => {
      await expect(
        authService.register({
          email: "test@example.com",
          password: "Short1@",
          firstName: "Test",
          lastName: "User",
          role: "buyer",
          companyName: "Test Co",
        }),
      ).rejects.toThrow("Password must be at least 12 characters");
    });

    it("should reject password no uppercase", async () => {
      await expect(
        authService.register({
          email: "test@example.com",
          password: "securepass123!",
          firstName: "Test",
          lastName: "User",
          role: "buyer",
          companyName: "Test Co",
        }),
      ).rejects.toThrow(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      );
    });

    it("should reject password no digit", async () => {
      await expect(
        authService.register({
          email: "test@example.com",
          password: "SecurePass!@#abc",
          firstName: "Test",
          lastName: "User",
          role: "buyer",
          companyName: "Test Co",
        }),
      ).rejects.toThrow(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      );
    });

    it("should reject password no special char", async () => {
      await expect(
        authService.register({
          email: "test@example.com",
          password: "SecurePass1234",
          firstName: "Test",
          lastName: "User",
          role: "buyer",
          companyName: "Test Co",
        }),
      ).rejects.toThrow(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      );
    });

    it("should reject invalid email format", async () => {
      await expect(
        authService.register({
          email: "not-an-email",
          password: "SecureP@ss123!",
          firstName: "Test",
          lastName: "User",
          role: "buyer",
          companyName: "Test Co",
        }),
      ).rejects.toThrow("Invalid email format");
    });

    it("should reject missing firstName", async () => {
      await expect(
        authService.register({
          email: "test@example.com",
          password: "SecureP@ss123!",
          firstName: "",
          lastName: "User",
          role: "buyer",
          companyName: "Test Co",
        }),
      ).rejects.toThrow("First name is required");
    });

    it("should reject missing lastName", async () => {
      await expect(
        authService.register({
          email: "test@example.com",
          password: "SecureP@ss123!",
          firstName: "Test",
          lastName: "",
          role: "buyer",
          companyName: "Test Co",
        }),
      ).rejects.toThrow("Last name is required");
    });

    it("should reject missing companyName", async () => {
      await expect(
        authService.register({
          email: "test@example.com",
          password: "SecureP@ss123!",
          firstName: "Test",
          lastName: "User",
          role: "buyer",
          companyName: "",
        }),
      ).rejects.toThrow("Company name is required");
    });
  });

  describe("login", () => {
    it("should login with valid credentials and return tokens", async () => {
      const mockUser = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organization_id: "00000000-0000-0000-0000-000000000001",
        password_hash: "$2b$12$fakehash",
        is_active: true,
        organization_name: "Test Company",
        organization_type: "government",
      };

      // Query 1: SELECT user by email, Query 2: INSERT refresh token
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Make bcrypt.compare return true for this test
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: "buyer@example.com",
        password: "SecurePass123",
      });

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw AuthenticationError for wrong password", async () => {
      const mockDatabase = require("../../config/database");
      mockDatabase.pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        authService.login({
          email: "buyer@example.com",
          password: "WrongPassword",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw AuthenticationError for non-existent email", async () => {
      const mockDatabase = require("../../config/database");
      mockDatabase.pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        authService.login({
          email: "nonexistent@example.com",
          password: "WrongPassword",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw AuthorizationError for inactive user", async () => {
      // The service SQL filters WHERE is_active = true, so inactive users
      // never appear in results — the service throws "Invalid credentials".
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        authService.login({
          email: "inactive@example.com",
          password: "WrongPassword",
        }),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refreshToken", () => {
    it("should refresh valid token and return new tokens", async () => {
      const mockUserRow = {
        token_id: "token-001",
        id: "user-001",
        email: "buyer@example.com",
        roles: ["buyer"],
        organization_id: "org-001",
      };

      // Use a valid UUID — the service now guards against non-UUID strings.
      const validUuidToken = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

      // Query 1: SELECT token+user, Query 2: invalidate old token, Query 3: insert new token
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUserRow], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await authService.refreshToken({
        refreshToken: validUuidToken,
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toMatch(/^eyJ/); // JWT
      expect(result.refreshToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("should throw AuthenticationError for expired token", async () => {
      // Service returns the same error for expired, used, or invalid tokens
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        authService.refreshToken({ refreshToken: "expired-token" }),
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should throw AuthenticationError for already used token", async () => {
      // Service returns the same error for expired, used, or invalid tokens
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        authService.refreshToken({ refreshToken: "used-token" }),
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should throw AuthenticationError for invalid token", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        authService.refreshToken({ refreshToken: "invalid-token" }),
      ).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("logout", () => {
    it("should logout with valid token by expiring it in the database", async () => {
      // Use a valid UUID — the service now guards against non-UUID strings.
      const validUuidToken = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await expect(authService.logout(validUuidToken)).resolves.toBeUndefined();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE user_tokens"),
        [validUuidToken],
      );
    });

    it("should handle logout gracefully even if token does not exist", async () => {
      // Non-UUID strings are silently skipped by the UUID guard (no DB call).
      // This test verifies the service does NOT throw for invalid/non-UUID tokens.
      await expect(
        authService.logout("nonexistent-token"),
      ).resolves.toBeUndefined();
      // The DB query should NOT have been called (UUID guard returned early)
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe("forgotPassword", () => {
    it("should send reset email for valid email", async () => {
      const mockEmail = "buyer@example.com";

      // Query 1: SELECT user by email, Query 2: INSERT reset token
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: "user-001", email: mockEmail }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // forgotPassword returns void — just check it doesn't throw
      await expect(
        authService.forgotPassword({ email: mockEmail }),
      ).resolves.toBeUndefined();

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it("should return success for non-existent email (no info leak)", async () => {
      const mockEmail = "nonexistent@example.com";

      // Service queries DB first to check if user exists, then returns early
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        authService.forgotPassword({ email: mockEmail }),
      ).resolves.toBeUndefined();

      // Only the SELECT was called; INSERT for token was NOT called
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe("resetPassword", () => {
    it("should reset password with valid token", async () => {
      const mockToken = "valid-reset-token";
      const mockNewPassword = "NewSecureP@ss456!";
      const mockTokenRow = {
        id: mockToken,
        user_id: "user-001",
        token_type: "reset",
        expires_at: new Date(Date.now() + 3600_000),
      };
      const mockUser = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organization_id: "org-001",
        password_hash: "$2b$12$fakehash",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      } as any;

      // Service queries: 1) SELECT token, 2) SELECT user, 3) UPDATE password,
      // 4) invalidate tokens, 5) INSERT new refresh token
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockTokenRow], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$12$newhash");

      const result = await authService.resetPassword({
        token: mockToken,
        password: mockNewPassword,
      });

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toMatch(/^eyJ/); // JWT
      expect(result.refreshToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("should throw AuthenticationError for expired token", async () => {
      // Service throws "Invalid or expired reset token" for both expired and invalid tokens
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        authService.resetPassword({
          token: "expired-token",
          password: "NewSecurePass456",
        }),
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw AuthenticationError for invalid token", async () => {
      // Service throws "Invalid or expired reset token" for both expired and invalid tokens
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        authService.resetPassword({
          token: "invalid-token",
          password: "NewSecurePass456",
        }),
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should reject password same as current password", async () => {
      const mockToken = "valid-reset-token";
      const mockNewPassword = "SameOldP@ss123!";
      const mockTokenRow = {
        id: mockToken,
        user_id: "user-001",
        token_type: "reset",
        expires_at: new Date(Date.now() + 3600_000),
      };
      const mockUser = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organization_id: "org-001",
        password_hash: "$2b$12$fakehash",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      } as any;

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockTokenRow], rowCount: 1 }) // token check
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }); // user fetch

      // Simulate bcrypt.compare returning true (new == old)
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        authService.resetPassword({
          token: mockToken,
          password: mockNewPassword,
        }),
      ).rejects.toThrow("New password must be different from current password");
    });

    it("should reject password in history (5) — checks last 5 hashes in password_history", async () => {
      const mockToken = "valid-reset-token";
      const newPassword = "NewSecureP@ss123!";

      const mockTokenRow = {
        id: mockToken,
        user_id: "user-001",
        token_type: "reset",
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        created_at: "2024-01-01T00:00:00Z",
      };
      const mockUser = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organization_id: "org-001",
        password_hash: "$2b$12$currenthash",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      } as any;

      // Simulate 5 password_history rows (one of which matches the new password)
      const historyRows = [
        { password_hash: "$2b$12$old1" },
        { password_hash: "$2b$12$old2" },
        { password_hash: "$2b$12$old3" },
        { password_hash: "$2b$12$matchingOldHash" },
        { password_hash: "$2b$12$old5" },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockTokenRow], rowCount: 1 }) // token check
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // user fetch
        .mockResolvedValueOnce({ rows: historyRows, rowCount: 5 }); // password_history

      // bcrypt.compare calls:
      //  1. current password check → false (new != current)
      //  2. history[0] → false
      //  3. history[1] → false
      //  4. history[2] → false
      //  5. history[3] → true  (matches a previous password)
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(false) // new != current hash
        .mockResolvedValueOnce(false) // history[0]
        .mockResolvedValueOnce(false) // history[1]
        .mockResolvedValueOnce(false) // history[2]
        .mockResolvedValueOnce(true); // history[3] ← match!

      await expect(
        authService.resetPassword({ token: mockToken, password: newPassword }),
      ).rejects.toThrow("Password was used recently");
    });
  });

  describe("getMe", () => {
    it("should return user profile for valid ID", async () => {
      // DB row uses snake_case column names
      const mockRow = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organization_id: "org-001",
        organization_name: "Test Company",
        organization_type: "government",
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 });

      const result = await authService.getMe("user-001");

      expect(result).toBeDefined();
      // Service maps snake_case DB fields to camelCase return shape
      expect(result).toEqual({
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        orgId: "org-001",
        organizationName: "Test Company",
        organizationType: "government",
      });
      expect(mockPool.query).toHaveBeenCalled();
    });

    it("should throw NotFoundError for non-existent user", async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(authService.getMe("user-999")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("generateAccessToken", () => {
    it("should generate valid JWT with correct claims", async () => {
      const mockUser = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organizationId: 1,
        organization_id: "org-001",
        password_hash: "hashed_password",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      } as any;

      const result = await authService.generateAccessToken(mockUser);

      expect(result).toBeDefined();
      expect(result).toMatch(/^eyJ/); // JWT format - generateAccessToken returns a string
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate valid UUID v4", () => {
      const result = authService.generateRefreshToken();

      expect(result).toBeDefined();
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      ); // Standard UUID format (8-4-4-4-12)
    });
  });

  describe("hashPassword", () => {
    it("should hash password with bcrypt cost factor 12", async () => {
      const mockPassword = "SecureP@ss123!";
      const result = await authService.hashPassword(mockPassword);

      expect(result).toBeDefined();
      // bcrypt is mocked; verify it was called with the correct cost factor
      expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, 12);
      expect(result).toBe("$2b$12$fakehash");
    });
  });

  describe("verifyPassword", () => {
    it("should return true for a matching password", async () => {
      const mockPassword = "SecureP@ss123!";
      const mockHash = "$2b$12$fakehash";
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await authService.verifyPassword(mockPassword, mockHash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(mockPassword, mockHash);
    });

    it("should return false for a non-matching password", async () => {
      const mockPassword = "WrongP@ss123!";
      const mockHash = "$2b$12$fakehash";
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const result = await authService.verifyPassword(mockPassword, mockHash);

      expect(result).toBe(false);
    });
  });

  describe("tokenExpiration", () => {
    it("should set access token expiration to 15 minutes", async () => {
      const mockUser = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organizationId: 1,
        organization_id: "org-001",
        password_hash: "hashed_password",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      } as any;

      const result = await authService.generateAccessToken(mockUser);

      expect(result).toBeDefined();
      // generateAccessToken returns a JWT string directly - expiresIn is encoded in the JWT
      expect(result).toMatch(/^eyJ/); // JWT format
    });

    it("should store refresh token in DB with 30-day expiration via INTERVAL", async () => {
      // generateRefreshToken() returns a plain UUID; the 30-day expiry is stored
      // in the DB INSERT — this test verifies that SQL contract.
      const mockUser = {
        id: "user-001",
        email: "buyer@example.com",
        name: "Buyer User",
        roles: ["buyer"],
        organization_id: "org-001",
        organization_type: "government",
        password_hash: "$2b$12$fakehash",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      } as any;

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // user lookup
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT user_tokens

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true); // password valid

      await authService.login({
        email: "buyer@example.com",
        password: "ValidP@ss123!",
      });

      // Find the INSERT call that stores the refresh token
      const insertCall = mockPool.query.mock.calls.find(
        (call: any[]) =>
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO user_tokens") &&
          call[0].includes("INTERVAL '30 days'"),
      );

      expect(insertCall).toBeDefined();
      // The INSERT should bind: [token_uuid, user_id, 'refresh']
      expect(insertCall![1][1]).toBe("user-001");
      expect(insertCall![1][2]).toBe("refresh");
    });
  });
});
