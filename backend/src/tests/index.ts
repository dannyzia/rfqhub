/**
 * Test Utilities Index - Section 2 & 3: Test Infrastructure
 * MASTER_TESTING_PLAN_REVISED.md
 *
 * Central export point for all test utilities and fixtures
 * Import from this file to access all testing infrastructure
 */

// Setup and configuration
// Note: setup.ts is imported as a side effect for initialization
import "./setup";

// Test data and fixtures
export * from "./test-data";
export * from "./test-fixtures";

// Request utilities
export { TestRequest, ResponseMatchers, APIAssertions } from "./test-request";

// Database utilities
export * as TestDB from "./test-database";

// Assertion utilities
export * as Assertions from "./test-assertions";

// Re-export commonly used items at top level
export {
  TEST_USERS,
  TEST_ORGS,
  createTestUser,
  createTestOrg,
  createMultipleTestUsers,
  clearTestData,
  generateTestTokens,
  waitFor,
} from "./test-data";

export {
  createMockUser,
  createMockOrganization,
  createMockTender,
  createMockTenderItem,
  createMockBid,
  createMockBidItem,
  createMockEvaluation,
  createMockEvaluationScore,
  createMockAward,
  createMockVendor,
  createMockNotification,
  createMockDocument,
  createMockTenderType,
  createMockRegistrationRequest,
  createMockLoginRequest,
  createMockTenderRequest,
  createMockBidRequest,
  createTenderWithItems,
  createBidWithItems,
  createEvaluationWithBids,
} from "./test-fixtures";

// Global test utilities are declared in setup.ts (imported above)
