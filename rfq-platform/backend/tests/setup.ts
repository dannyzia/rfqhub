// Test setup file for Jest
// This file runs before all tests

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.console = {
  ...console,
  // Suppress console logs during tests (uncomment to enable)
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: console.error, // Keep errors visible
};

// Mock external services if needed
beforeAll(async () => {
  // Setup test database connection
  // Setup test Redis connection
  // Any other global setup
});

afterAll(async () => {
  // Close database connections
  // Close Redis connections
  // Any other global teardown
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
