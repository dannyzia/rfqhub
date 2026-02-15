require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUserTableSchema() {
  try {
    console.log('=== Checking Users Table Schema ===');
    
    // Get table structure
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable ? 'nullable' : 'not null'})`);
    });
    
    // Check if role column exists
    const roleColumn = schemaResult.rows.find(col => col.column_name === 'role');
    if (roleColumn) {
      console.log('✅ Role column exists');
    } else {
      console.log('❌ Role column does NOT exist');
    }
    
    // Check what columns we do have
    console.log('\nAvailable columns:');
    schemaResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserTableSchema();
