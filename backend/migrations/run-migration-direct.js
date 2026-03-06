const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Log DATABASE_URL for debugging
console.log(
  "🔌 DATABASE_URL:",
  process.env.DATABASE_URL ? "Set (will show partial)" : "NOT SET",
);

if (!process.env.DATABASE_URL) {
  console.error("❌ CRITICAL ERROR: DATABASE_URL is not set!");
  console.error("❌ Please ensure:");
  console.error("   1. backend/.env file exists");
  console.error("   2. backend/.env contains DATABASE_URL=...");
  console.error("   3. You are running from backend/migrations directory");
  process.exit(1);
}

const migrationFile = path.join(__dirname, "./017_add_missing_tables.sql");
const migrationSQL = fs.readFileSync(migrationFile, "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // Pool size for Neon
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
});

async function runMigration() {
  console.log("🔄 Starting migration 017: Add Missing Tables...");
  console.log("📂 Migration file:", migrationFile);
  console.log("🔌 Using connection string from environment...");

  const client = await pool.connect();
  try {
    console.log("✅ Database connection established");
    console.log("🔐 Database info:", {
      host: client.host,
      port: client.port,
      database: client.database,
      user: client.user,
    });

    // Start transaction
    await client.query("BEGIN");

    // Execute migration
    console.log("📝 Executing migration SQL...");
    await client.query(migrationSQL);

    // Commit transaction
    await client.query("COMMIT");

    console.log("✅ Migration 017 completed successfully!");
    console.log("   Created tables:");
    console.log("   - activity_logs");
    console.log("   - bid_feature_values");
    console.log("   - subscriptions");
    console.log("   - subscription_usage");
    console.log("   - tender_committee_members");
    console.log("   - tender_documents");
    console.log("   - tender_features");
    console.log("   - tender_workflow_states");
    console.log("   - user_profiles");

    // Verify tables were created
    console.log("🔍 Verifying created tables...");
    const checkResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'activity_logs', 'bid_feature_values', 'subscriptions', 'subscription_usage',
        'tender_committee_members', 'tender_documents', 'tender_features',
        'tender_workflow_states', 'user_profiles'
      )
      ORDER BY table_name
    `);

    console.log("📊 Verification - Tables created:");
    checkResult.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    const createdCount = checkResult.rows.length;
    if (createdCount === 9) {
      console.log("✅ All 9 tables verified successfully!");
    } else {
      console.warn(`⚠️  Warning: Expected 9 tables, but found ${createdCount}`);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error detail:", error);
    await client.query("ROLLBACK");
    console.log("🔄 Rolled back changes");
  } finally {
    client.release();
    await pool.end();
    console.log("🔌 Database connections closed");
    console.log("✅ Migration script finished");
  }
}

runMigration();
