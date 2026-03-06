import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests (matches jest.config.js)
jest.setTimeout(60000);

// Monitor memory usage during tests
if (process.env.NODE_ENV === 'test') {
  const originalConsole = console;
  const memoryLog = () => {
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
    
    if (usedMB > 3000) { // Warn if using more than 3GB
      originalConsole.warn(`⚠️  High memory usage: ${usedMB}MB / ${totalMB}MB`);
    }
  };
  
  // Log memory every 30 seconds during long-running tests
  const memoryInterval = setInterval(memoryLog, 30000);
  
  // Clear interval when tests complete
  process.on('exit', () => clearInterval(memoryInterval));
  process.on('SIGINT', () => clearInterval(memoryInterval));
  process.on('SIGTERM', () => clearInterval(memoryInterval));
  
  // Also clear interval after Jest tests complete
  afterAll(() => {
    clearInterval(memoryInterval);
  });
}

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: console.error,
};

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testDb: import('pg').Pool | null;
      testRedis: import('ioredis').Redis | null;
    }
  }
}

