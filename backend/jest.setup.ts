/**
 * Jest Test Setup
 * Automatically seeds test database with required tender types
 * before any tests execute
 */

import { pool } from './src/config/database';

// Import seeding function
import { seedMissingTenderTypes } from './src/tests/seed-missing-tender-types.test';

/**
 * Run before all tests
 * Seeds test database with required tender types (PG1, PG2, PG3, PW1, PW3, etc.)
 */
beforeAll(async () => {
  console.log('🔍 Starting Jest test setup...');
  try {
    // Seed missing tender types in test database
    const result = await seedMissingTenderTypes();
    if (result.seeded > 0) {
      console.log(`✅ Seeded ${result.seeded} missing tender types`);    } else {
      console.log('✅ All required tender types already exist');    }    console.log(`📊 Database contains ${result.alreadyExists} tender types`);  } catch (error) {
    console.error('❌ Error in Jest test setup:', error);
    throw error; // Fail test run if seeding fails  }
});

/**
 * Run after all tests complete
 * No cleanup needed for test data
 */
afterAll(() => {
  console.log('🏁 All tests completed');});
