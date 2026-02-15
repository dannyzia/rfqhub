#!/usr/bin/env node

/**
 * Generate complete migration SQL with proper bcrypt hashes
 * Usage: node scripts/generate-migration.js
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const testUsers = [
  {
    id: 'user-admin-001',
    org_id: 'org-admin',
    name: 'Admin User',
    email: 'admin@rfqbuddy.com',
    password: 'admin123',
    roles: "ARRAY['admin', 'buyer']"
  },
  {
    id: 'user-buyer-001',
    org_id: 'org-buyer1',
    name: 'Buyer User',
    email: 'buyer@rfqbuddy.com',
    password: 'buyer123',
    roles: "ARRAY['buyer']"
  },
  {
    id: 'user-vendor-001',
    org_id: 'org-vendor1',
    name: 'Vendor User',
    email: 'vendor@rfqbuddy.com',
    password: 'vendor123',
    roles: "ARRAY['vendor']"
  }
];

async function generateMigration() {
  console.log('Generating migration with bcrypt password hashes...\n');
  
  let sqlContent = `-- Migration: 007_seed_test_users.sql
-- Description: Seeds test user accounts for development/testing

BEGIN;

-- Create organizations first (if they don't exist)
INSERT INTO organizations (id, name, type, is_active, created_at)
VALUES 
  ('org-admin', 'RFQ Buddy', 'buyer', true, NOW()),
  ('org-buyer1', 'ABC Procurement Ltd', 'buyer', true, NOW()),
  ('org-vendor1', 'XYZ Suppliers Inc', 'vendor', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed test users
INSERT INTO users (
  id,
  organization_id,
  name,
  email,
  password_hash,
  roles,
  is_active,
  created_at,
  updated_at
)
VALUES
`;

  const insertValues = [];
  for (const user of testUsers) {
    const hash = await bcrypt.hash(user.password, 12);
    console.log(`Generated hash for ${user.email} (${user.password}): ${hash}`);
    
    insertValues.push(`  (
    '${user.id}',
    '${user.org_id}',
    '${user.name}',
    '${user.email}',
    '${hash}',
    ${user.roles},
    true,
    NOW(),
    NOW()
  )`);
  }

  sqlContent += insertValues.join(',\n') + '\n';
  sqlContent += `ON CONFLICT (email) DO NOTHING;

COMMIT;
`;

  const migrationPath = path.join(__dirname, '../rfq-platform/database/migrations/007_seed_test_users.sql');
  fs.writeFileSync(migrationPath, sqlContent);
  
  console.log(`\n✅ Migration file generated: ${migrationPath}`);
  console.log('\nTest Credentials:');
  console.log('  admin@rfqbuddy.com / admin123');
  console.log('  buyer@rfqbuddy.com / buyer123');
  console.log('  vendor@rfqbuddy.com / vendor123');
}

generateMigration().catch(err => {
  console.error('Error generating migration:', err);
  process.exit(1);
});
