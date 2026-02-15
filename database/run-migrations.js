// database/run-migrations.js
// Migration runner script for Tender Types implementation

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Read DATABASE_URL from .env file directly
const envPath = path.join(__dirname, '../backend/.env');
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

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting Tender Types Migrations...\n');
        
        const migrations = [
            '001_create_tender_type_definitions.sql',
            '002_create_document_requirements.sql',
            '003_seed_tender_types.sql',
            '004_update_tenders_table.sql',
            '005_create_tender_document_submissions.sql',
            '007_seed_test_users.sql'
        ];
        
        for (const migration of migrations) {
            const filePath = path.join(__dirname, 'migrations', migration);
            
            if (!fs.existsSync(filePath)) {
                console.error(`❌ Migration file not found: ${filePath}`);
                continue;
            }
            
            const sql = fs.readFileSync(filePath, 'utf-8');
            console.log(`📋 Running: ${migration}`);
            
            try {
                await client.query(sql);
                console.log(`✅ ${migration} completed\n`);
            } catch (error) {
                console.error(`❌ Error in ${migration}:`, error.message);
                console.error(error.detail || '');
                throw error;
            }
        }
        
        console.log('🎉 All migrations completed successfully!\n');
        
        // Verify
        console.log('📊 Verification:');
        const result = await client.query('SELECT COUNT(*) as count FROM tender_type_definitions;');
        console.log(`✅ Tender types seeded: ${result.rows[0].count}`);
        
        const docReqResult = await client.query('SELECT COUNT(*) as count FROM tender_type_document_requirements;');
        console.log(`✅ Document requirements created: ${docReqResult.rows[0].count}`);
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
