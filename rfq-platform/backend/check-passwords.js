require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUserPasswords() {
  try {
    console.log('=== Checking User Passwords ===');
    const result = await pool.query(`
      SELECT email, password_hash 
      FROM users 
      WHERE email IN ('callzr@gmail.com', 'test2@example.com')
      ORDER BY created_at DESC
    `);
    
    console.log('Found users:');
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Password Hash: ${user.password_hash}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserPasswords();
