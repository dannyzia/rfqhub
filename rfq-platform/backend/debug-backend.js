require('dotenv').config();
const { Pool } = require('pg');

console.log('=== Environment Check ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

console.log('\n=== Database Connection Test ===');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('SELECT NOW()')
  .then(result => {
    console.log('✅ Database connected successfully');
    console.log('Current time:', result.rows[0].now);
    return pool.end();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
