// Migration runner for 020_make_simple_rfq_columns_nullable
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Read DATABASE_URL from .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1].trim() : null;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL
});

async function runMigration020() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Running Migration 020: Make Simple RFQ columns nullable...\n');
        
        const migrationFile = '020_make_simple_rfq_columns_nullable.sql';
        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Migration file not found: ${migrationPath}`);
            process.exit(1);
        }
        
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`📋 Reading: ${migrationFile}`);
        
        await client.query(sql);
        console.log(`✅ ${migrationFile} completed\n`);
        
        // Verify the changes
        console.log('🔍 Verifying column changes...');
        const result = await client.query(`
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'tenders'
            AND column_name IN ('buyer_org_id', 'created_by')
            ORDER BY column_name
        `);
        
        console.log('📊 Tenders table columns:');
        for (const row of result.rows) {
            console.log(`   ${row.column_name}: nullable = ${row.is_nullable === 'YES' ? '✅' : '❌'}`);
        }
        
        const allNullable = result.rows.every(r => r.is_nullable === 'YES');
        
        if (allNullable) {
            console.log('\n🎉 Migration 020 completed successfully!');
            console.log('✅ buyer_org_id is now nullable');
            console.log('✅ created_by is now nullable');
            console.log('\n✨ Simple RFQ can now work without authenticated users');
        } else {
            console.error('\n❌ Verification failed: columns are not nullable');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ Migration 020 failed:', error.message);
        console.error('📋 Full error:', error);
        
        // Check if migration was already applied
        if (error.code === '01000') {
            console.log('\n⚠️  Migration may have already been applied');
        }
        
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration020();
