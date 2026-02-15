require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsers() {
  try {
    console.log('=== Checking Users in Database ===');
    const result = await pool.query('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 10');
    console.log('Total users:', result.rows.length);
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();
