/**
 * Test Data Utilities - Section 3: Test Data Management
 * MASTER_TESTING_PLAN_REVISED.md
 *
 * Provides utilities for creating and managing test data:
 * - Test user accounts
 * - Test organizations
 * - Sample tenders
 * - Sample bids
 * - Master data
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database";

/**
 * Test user credentials - Section 3.1
 * Maps to MASTER_TESTING_PLAN_REVISED.md Table
 */
export const TEST_USERS = {
  ADMIN: {
    id: "user-admin-001",
    email: "admin@test.com",
    password: "Admin@123456",
    role: "admin",
    firstName: "Admin",
    lastName: "User",
  },
  GOVT_BUYER_1: {
    id: "user-buyer-001",
    email: "govt.buyer1@test.com",
    password: "Buyer@123456",
    role: "buyer",
    firstName: "Govt",
    lastName: "Buyer One",
  },
  GOVT_BUYER_2: {
    id: "user-buyer-002",
    email: "govt.buyer2@test.com",
    password: "Buyer@123456",
    role: "buyer",
    firstName: "Govt",
    lastName: "Buyer Two",
  },
  NON_GOVT_BUYER: {
    id: "user-buyer-003",
    email: "nongov.buyer1@test.com",
    password: "Buyer@123456",
    role: "buyer",
    firstName: "Non Govt",
    lastName: "Buyer",
  },
  VENDOR_1: {
    id: "user-vendor-001",
    email: "vendor1@test.com",
    password: "Vendor@123456",
    role: "vendor",
    firstName: "Vendor",
    lastName: "One",
  },
  VENDOR_2: {
    id: "user-vendor-002",
    email: "vendor2@test.com",
    password: "Vendor@123456",
    role: "vendor",
    firstName: "Vendor",
    lastName: "Two",
  },
  EVALUATOR_1: {
    id: "user-evaluator-001",
    email: "evaluator1@test.com",
    password: "Eval@123456",
    role: "evaluator",
    firstName: "Evaluator",
    lastName: "One",
  },
};

/**
 * Test organization accounts - Section 3.2
 */
export const TEST_ORGS = {
  GOVT_AGENCY: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Government Procurement Agency",
    type: "buyer",
    subscription: "platinum",
  },
  PRIVATE_COMPANY: {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Private Company Ltd",
    type: "buyer",
    subscription: "gold",
  },
  VENDOR_CORP: {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Vendor Corp Inc",
    type: "vendor",
    subscription: "silver",
  },
};

/**
 * Create a test user in the database
 */
export async function createTestUser(
  userSpec?: Partial<(typeof TEST_USERS)[keyof typeof TEST_USERS]> & {
    organizationId?: string;
  },
) {
  // Use defaults for missing properties
  const spec = {
    id: uuidv4(),
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123@",
    role: "buyer", // Default role
    firstName: "Test",
    lastName: "User",
    ...userSpec,
  };

  // Override role if explicitly provided
  if (userSpec?.role) {
    spec.role = userSpec.role;
  }

  // Debug logging
  console.log('🔍 DEBUG createTestUser called with:', {
    userSpec,
    finalRole: spec.role,
    rolesArray: [spec.role]
  });

  const hashedPassword = await bcrypt.hash(spec.password, 12);
  const fullName = `${spec.firstName} ${spec.lastName}`;

  // Determine which organization this user belongs to.
  // If an explicit organizationId is provided, upsert that org; otherwise fall
  // back to the canonical test org (GOVT_AGENCY).
  const orgId = userSpec?.organizationId ?? TEST_ORGS.GOVT_AGENCY.id;
  const orgName =
    orgId === TEST_ORGS.GOVT_AGENCY.id
      ? TEST_ORGS.GOVT_AGENCY.name
      : `Test Org ${orgId}`;

  await pool.query(
    `INSERT INTO organizations (id, name, type)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    [orgId, orgName, "buyer"],
  );

  const result = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, roles, is_active, organization_id)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name,
               password_hash = EXCLUDED.password_hash,
               roles = EXCLUDED.roles
         RETURNING id, email, roles, organization_id AS "organizationId"`,
    [
      spec.id,
      fullName,
      spec.email,
      hashedPassword,
      JSON.stringify([spec.role]), // Use JSON.stringify for proper array serialization
      orgId,
    ],
  );
  return result.rows[0];
}

/**
 * Create a test organization in the database
 */
export async function createTestOrg(orgSpec: {
  id: string;
  name: string;
  type: string;
  subscription?: string;
}) {
  console.log("🏢 [DEBUG] Starting createTestOrg() with spec:", orgSpec);

  try {
    const result = await pool.query(
      `INSERT INTO organizations (id, name, type)
       VALUES ($1, $2, $3)
       RETURNING id, name, type`,
      [orgSpec.id, orgSpec.name, orgSpec.type],
    );

    console.log("🏢 [DEBUG] Query result rows:", result.rows.length);
    console.log("🏢 [DEBUG] Created/found organization:", result.rows[0]);

    return result.rows[0];
  } catch (err: any) {
    console.error("❌ [DEBUG] Error in createTestOrg():", err.message);
    console.error("❌ [DEBUG] Error details:", err.detail || "No details");
    throw err;
  }
}

/**
 * Create multiple test users efficiently
 */
export async function createMultipleTestUsers(
  userSpecs: Array<(typeof TEST_USERS)[keyof typeof TEST_USERS]>,
) {
  const results = [];

  for (const spec of userSpecs) {
    const user = await createTestUser(spec);
    results.push(user);
  }

  return results;
}

/**
 * Clear test data (truncate all tables)
 * OPTIMIZED: Uses batch TRUNCATE for better performance
 */
export async function clearTestData() {
  const startTime = Date.now();

  // ── Tables to truncate (test-created data only) ──────────────────────────
  // IMPORTANT: "tender_type_definitions" is EXCLUDED — it holds canonical seed
  // data seeded by migrations 003 / 009 / 013.  Truncating it would destroy
  // master data that many tests rely on.
  //
  // Also excluded: master/reference tables such as uom_master, currency_master,
  // tender_status_master, feature_type_master, etc. — these are global seeds.
  const allTables = [
    "audit_logs",
    "activity_logs",
    "evaluations",
    "evaluation_line_scores",
    "bids",
    "bid_items",
    "bid_feature_values",
    "bid_envelopes",
    "awards",
    "tender_workflow_states",
    "tender_workflow_log",
    "tender_role_assignments",
    "tender_committee_members",
    "tender_features",
    "tender_items",
    "tender_documents",
    "live_bid_updates",
    "live_bidding_sessions",
    "limited_tender_vendors",
    "tenders",
    "notifications",
    "vendor_documents",
    "vendor_categories",
    "vendor_profiles",
    "user_tokens",
    "user_profiles",
    "password_history",
    "subscription_usage",
    "subscriptions",
    "organization_subscriptions",
    "organization_storage_usage",
    "tender_quota_usage",
    "file_uploads",
    "users",
    "organizations",
  ];

  // Discover which tables actually exist (resilient to schema differences)
  const existingTables: string[] = [];
  for (const table of allTables) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        )`,
        [table],
      );
      if (result.rows[0].exists) {
        existingTables.push(table);
      }
    } catch {
      // Cannot check — skip
    }
  }

  if (existingTables.length === 0) return;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Single TRUNCATE is much faster than N individual ones
      await client.query(
        `TRUNCATE TABLE ${existingTables.join(", ")} CASCADE`,
      );
      await client.query("COMMIT");
    } catch (err: any) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    // Fallback: truncate table-by-table
    for (const table of existingTables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      } catch (tableErr: any) {
        if (!tableErr.message.includes("does not exist")) {
          console.error(`❌ Error truncating ${table}:`, tableErr.message);
        }
      }
    }
  }

  const elapsed = Date.now() - startTime;
  if (elapsed > 3000) {
    console.warn(`⚠️  clearTestData() took ${elapsed}ms — consider investigating DB performance`);
  }
}

/**
 * Generate real signed JWT access tokens + a UUID refresh token.
 *
 * Uses the same JWT_SECRET as the production auth service so the tokens
 * pass real middleware validation in integration tests.
 */
export async function generateTestTokens(userId: string, roles: string[] = ['buyer']) {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-rfq-buddy-testing-only-2026';
  const payload = {
    id: userId,
    email: `test-${userId}@example.com`,
    roles,
    organizationId: TEST_ORGS.GOVT_AGENCY.id,
  };
  const accessToken = jwt.sign(payload, secret, { expiresIn: 900 });
  const refreshToken = uuidv4(); // UUID stored in user_tokens table

  // Persist the refresh token so /api/auth/refresh-token can validate it
  await pool.query(
    `INSERT INTO user_tokens (id, user_id, token_type, expires_at)
     VALUES ($1, $2, 'refresh', NOW() + INTERVAL '30 days')
     ON CONFLICT (id) DO NOTHING`,
    [refreshToken, userId],
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}

/**
 * Wait for async operations
 */
export async function waitFor(condition: () => boolean, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timeout waiting for condition");
}

export default {
  TEST_USERS,
  TEST_ORGS,
  createTestUser,
  createTestOrg,
  createMultipleTestUsers,
  clearTestData,
  generateTestTokens,
  waitFor,
};
