import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Enhanced database configuration with better error handling
const createPool = () => {
  try {
    // Use DATABASE_URL if provided, otherwise use individual parameters
    if (process.env.DATABASE_URL) {
      console.log('Using DATABASE_URL for connection');
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000, // Increased timeout for tests
        maxUses: 7500,
        allowExitOnIdle: false,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true }
            : process.env.DB_SSL === 'true' ? { rejectUnauthorized: false }
            : false,
      });
    } else {
      console.log('Using individual database parameters');
      return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME || 'rfq_platform',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true }
            : process.env.DB_SSL === 'true' ? { rejectUnauthorized: false }
            : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000, // Increased timeout for tests
      });
    }
  } catch (error) {
    console.error('Failed to create database pool:', error);
    throw error;
  }
};

const pool = createPool();

console.log('Using DATABASE_URL:', !!process.env.DATABASE_URL);

// Enhanced connection test with better error handling
const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW() as current_time, version() as postgres_version");
    console.log("✅ Database connected successfully");
    console.log("   Current time:", result.rows[0].current_time);
    console.log("   PostgreSQL version:", result.rows[0].postgres_version.split(' ')[0] + ' ' + result.rows[0].postgres_version.split(' ')[1]);
    
    // Test with a simple query to ensure the connection is working
    const testResult = await pool.query("SELECT 1 as test");
    if (testResult.rows[0].test === 1) {
      console.log("✅ Database query test passed");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", (error as Error).message);
    if (process.env.NODE_ENV !== 'test') {
      console.error("Make sure your DATABASE_URL is set correctly in .env");
      process.exit(1);
    }
    return false;
  }
};

// Test connection on startup (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  testConnection();
} else {
  // In test environment, just log the connection attempt
  console.log("🧪 Test environment - database connection will be tested during tests");
}

// Enhanced pool error handling
pool.on("error", (err) => {
  console.error("❌ Database pool error:", err.message);
  console.error("   This usually indicates a connection issue");
});


export { pool };
export default pool;
