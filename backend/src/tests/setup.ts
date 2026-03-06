/**
 * Test Setup - Section 2.1 Backend Test Configuration
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Initializes test environment:
 * - Load test environment variables from .env.test
 * - Set NODE_ENV to 'test'
 * - Configure global test timeouts
 * - Setup global test utilities
 */

import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(process.cwd(), '.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests (30 seconds)
jest.setTimeout(30000);

// Setup global console mocking to reduce test output noise
const originalError = console.error;
const originalLog = console.log;
const originalWarn = console.warn;

// Optionally suppress logs during tests (comment out to see logs)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   log: jest.fn(),
//   warn: jest.fn(),
//   debug: jest.fn(),
// };

// Restore console on failure for debugging
afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
  console.warn = originalWarn;
});

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var testUtils: {
    generateTestEmail: () => string;
    generateTestPassword: () => string;
    wait: (ms: number) => Promise<void>;
  };
}

// Test utilities
global.testUtils = {
  generateTestEmail: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@test.com`;
  },

  generateTestPassword: () => {
    return `TestPassword@${Date.now()}`;
  },

  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Suppress specific noisy warnings
const originalWarning = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarning;
});

export {};
