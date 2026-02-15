require('dotenv').config();
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('First 50 chars:', process.env.DATABASE_URL?.substring(0, 50));
