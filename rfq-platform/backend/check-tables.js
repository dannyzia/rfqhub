require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  try {
    console.log('=== Checking Database Tables ===');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if tenders table exists
    const tendersTable = tablesResult.rows.find(row => row.table_name === 'tenders');
    if (tendersTable) {
      console.log('✅ tenders table exists');
    } else {
      console.log('❌ tenders table does NOT exist');
    }
    
    // Check if users table exists
    const usersTable = tablesResult.rows.find(row => row.table_name === 'users');
    if (usersTable) {
      console.log('✅ users table exists');
    } else {
      console.log('❌ users table does NOT exist');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTables();
