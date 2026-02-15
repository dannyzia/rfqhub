const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_fWriGwH68pRF@ep-purple-wind-ah3dk5w1-pooler.c-3.us-east-1.aws.neon.tech/rfq_platform?sslmode=require&channel_binding=require'
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log('Current time from database:', result.rows[0]);
    await pool.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
