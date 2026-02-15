#!/usr/bin/env node

/**
 * Generate bcrypt password hashes for test users
 * Usage: npm run generate-test-hashes
 */

const bcrypt = require('bcryptjs');

const testUsers = [
  { email: 'admin@rfqbuddy.com', password: 'admin123' },
  { email: 'buyer@rfqbuddy.com', password: 'buyer123' },
  { email: 'vendor@rfqbuddy.com', password: 'vendor123' }
];

async function generateHashes() {
  console.log('Generating bcrypt password hashes...\n');
  
  for (const user of testUsers) {
    const hash = await bcrypt.hash(user.password, 12);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Hash: ${hash}\n`);
  }
  
  console.log('Add these hashes to 007_seed_test_users.sql');
}

generateHashes().catch(err => {
  console.error('Error generating hashes:', err);
  process.exit(1);
});
