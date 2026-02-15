/**
 * Environment Variable Validator
 *
 * This script checks if your .env file is configured correctly
 * for Neon PostgreSQL and Upstash Redis
 */

require('dotenv').config();

console.log('\n🔍 Validating Environment Variables...\n');
console.log('=' .repeat(60));

let hasErrors = false;

// Check DATABASE_URL
console.log('\n1️⃣  DATABASE_URL (Neon PostgreSQL)');
console.log('-'.repeat(60));

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL is not set!');
  console.log('   Add this to your .env file:');
  console.log('   DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require');
  hasErrors = true;
} else {
  const dbUrl = process.env.DATABASE_URL;
  console.log('✅ DATABASE_URL is set');

  // Check if it starts with postgresql://
  if (!dbUrl.startsWith('postgresql://')) {
    console.log('❌ Should start with "postgresql://"');
    console.log(`   Current: ${dbUrl.substring(0, 15)}...`);
    hasErrors = true;
  } else {
    console.log('✅ Starts with "postgresql://"');
  }

  // Check if it has ?sslmode=require
  if (!dbUrl.includes('?sslmode=require')) {
    console.log('❌ Missing "?sslmode=require" at the end!');
    console.log('   This is REQUIRED for Neon');
    console.log('   Add ?sslmode=require to the end of your DATABASE_URL');
    hasErrors = true;
  } else {
    console.log('✅ Has "?sslmode=require" (required for Neon)');
  }

  // Check if it contains neon.tech
  if (dbUrl.includes('neon.tech')) {
    console.log('✅ Points to Neon server');
  } else {
    console.log('⚠️  Doesn\'t seem to be a Neon URL');
  }
}

// Check REDIS_URL
console.log('\n2️⃣  REDIS_URL (Upstash Redis)');
console.log('-'.repeat(60));

if (!process.env.REDIS_URL) {
  console.log('❌ REDIS_URL is not set!');
  console.log('   Add this to your .env file:');
  console.log('   REDIS_URL=rediss://default:pass@host.upstash.io:6379');
  hasErrors = true;
} else {
  const redisUrl = process.env.REDIS_URL;
  console.log('✅ REDIS_URL is set');

  // Check if it starts with rediss:// (double 's' for SSL)
  if (!redisUrl.startsWith('rediss://')) {
    console.log('❌ Should start with "rediss://" (double \'s\' for SSL)');
    console.log(`   Current: ${redisUrl.substring(0, 10)}...`);
    console.log('   Make sure it\'s "rediss://" not "redis://"');
    hasErrors = true;
  } else {
    console.log('✅ Starts with "rediss://" (SSL enabled)');
  }

  // Check if it contains upstash.io
  if (redisUrl.includes('upstash.io')) {
    console.log('✅ Points to Upstash server');
  } else {
    console.log('⚠️  Doesn\'t seem to be an Upstash URL');
  }

  // Check if port is included
  if (redisUrl.includes(':6379')) {
    console.log('✅ Has port :6379');
  } else {
    console.log('⚠️  Port :6379 not found in URL');
  }
}

// Check JWT Secrets
console.log('\n3️⃣  JWT Secrets');
console.log('-'.repeat(60));

if (!process.env.JWT_SECRET) {
  console.log('❌ JWT_SECRET is not set!');
  console.log('   Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  hasErrors = true;
} else if (process.env.JWT_SECRET.length < 32) {
  console.log('❌ JWT_SECRET is too short (should be 32+ characters)');
  console.log(`   Current length: ${process.env.JWT_SECRET.length}`);
  hasErrors = true;
} else {
  console.log(`✅ JWT_SECRET is set (${process.env.JWT_SECRET.length} characters)`);
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.log('❌ JWT_REFRESH_SECRET is not set!');
  console.log('   Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  hasErrors = true;
} else if (process.env.JWT_REFRESH_SECRET.length < 32) {
  console.log('❌ JWT_REFRESH_SECRET is too short (should be 32+ characters)');
  console.log(`   Current length: ${process.env.JWT_REFRESH_SECRET.length}`);
  hasErrors = true;
} else {
  console.log(`✅ JWT_REFRESH_SECRET is set (${process.env.JWT_REFRESH_SECRET.length} characters)`);
}

// Check other important variables
console.log('\n4️⃣  Other Configuration');
console.log('-'.repeat(60));

const checks = [
  { key: 'NODE_ENV', expected: 'development', optional: true },
  { key: 'PORT', expected: '3000', optional: true },
  { key: 'CORS_ORIGINS', expected: null, optional: true },
  { key: 'FRONTEND_URL', expected: null, optional: true },
];

checks.forEach(check => {
  if (!process.env[check.key]) {
    if (!check.optional) {
      console.log(`❌ ${check.key} is not set!`);
      hasErrors = true;
    } else {
      console.log(`⚠️  ${check.key} is not set (optional)`);
    }
  } else {
    console.log(`✅ ${check.key} is set: ${process.env[check.key]}`);
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📋 SUMMARY\n');

if (hasErrors) {
  console.log('❌ Your .env file has errors that need to be fixed!\n');
  console.log('Common fixes:');
  console.log('1. Make sure DATABASE_URL ends with "?sslmode=require"');
  console.log('2. Make sure REDIS_URL starts with "rediss://" (double s)');
  console.log('3. Generate JWT secrets if missing');
  console.log('4. Remove any quotes around the values in .env file');
  console.log('\nExample .env format:');
  console.log('DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require');
  console.log('REDIS_URL=rediss://default:pass@host.upstash.io:6379');
  console.log('JWT_SECRET=your_generated_secret_here');
  console.log('\n⚠️  Do NOT use quotes in .env file!\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set correctly!\n');
  console.log('You can now run: npm run dev\n');
  process.exit(0);
}
