import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Use DATABASE_URL if provided, otherwise use individual parameters
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000, // Increased timeout
      maxUses: 7500, // Close connections after 7500 uses
      allowExitOnIdle: false,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || 'rfq_platform',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: {
        rejectUnauthorized: false,
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
    });

console.log('Using DATABASE_URL:', !!process.env.DATABASE_URL);

// Alternative configuration if using individual parameters instead of connection string
// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: parseInt(process.env.DB_PORT || "5432"),
//   database: process.env.DB_NAME,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   ssl: {
//     rejectUnauthorized: false, // Required for Neon
//   },
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 10000,
// });

// Test connection on startup
pool
  .query("SELECT NOW()")
  .then(() => {
    console.log("✅ Database connected successfully (Neon PostgreSQL)");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    console.error("Make sure your DATABASE_URL is set correctly in .env");
    process.exit(1);
  });

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
  process.exit(1);
});

export { pool };
export default pool;
