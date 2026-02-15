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
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    console.log('=== Checking Organizations ===');
    const orgResult = await pool.query('SELECT id, name, type, created_at FROM organizations ORDER BY created_at DESC LIMIT 10');
    console.log('Total organizations:', orgResult.rows.length);
    orgResult.rows.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name} (${org.type})`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Created: ${org.created_at}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();
