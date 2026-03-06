/**
 * Jest configuration for integration tests.
 *
 * Used by: npm run test:integration
 *
 * Key differences from jest.config.js:
 *  - testMatch targets only src/tests/integration/**
 *  - No testPathIgnorePatterns that would block integration tests
 *  - Higher testTimeout (120 s) for remote AlwaysData DB round-trips
 *  - clearMocks / resetMocks / restoreMocks OFF — integration tests use real
 *    implementations, not mocks
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests/integration"],
  testMatch: ["**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "__fixtures__",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  verbose: true,
  // Load .env.test before any module (so DATABASE_URL is set when pool is created)
  setupFiles: ["<rootDir>/tests/load-test-env.ts"],
  // Per-test setup (jest.setTimeout, etc.)
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  // Global lifecycle: connects to DB / Redis, then tears down after all suites finish
  globalSetup: "<rootDir>/tests/global-setup.ts",
  globalTeardown: "<rootDir>/tests/global-teardown.ts",
  testTimeout: 120000,   // 2 min — remote DB can be slow on first connect
  maxWorkers: 1,         // Serial execution avoids race conditions on shared test data
  // Do NOT clear/reset/restore mocks for integration tests — we use real implementations
  clearMocks: false,
  resetMocks: false,
  restoreMocks: false,
};
