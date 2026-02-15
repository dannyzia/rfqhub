const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read migration SQL
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'fix_roles_column.sql'),
  'utf8'
);

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration: Fix roles column...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Execute migration
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the fix
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('role', 'roles')
      ORDER BY column_name
    `);
    
    console.log('\n📊 Current users table columns:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
