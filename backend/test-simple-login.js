// Simple test to isolate login issue
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testSimpleLogin() {
  try {
    console.log('=== Simple Login Test ===');
    
    // Test 1: Direct database query
    console.log('1. Testing direct database query for user...');
    const userResult = await pool.query('SELECT email, password_hash FROM users WHERE email = $1', ['callzr@gmail.com']);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`   Found user: ${user.email}`);
      console.log(`   Password hash: ${user.password_hash}`);
      
      // Test 2: Direct password comparison (this will show the actual bcrypt issue)
      const testPassword = 'TestPassword123!';
      const bcrypt = require('bcryptjs');
      
      console.log('2. Testing password comparison...');
      const isMatch = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`   Password match: ${isMatch}`);
      
      if (isMatch) {
        console.log('✅ Password comparison works!');
      } else {
        console.log('❌ Password comparison failed!');
      }
    } else {
      console.log('❌ User not found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimpleLogin();
