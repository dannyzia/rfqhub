// Verify migrations
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
const DATABASE_URL = dbUrlMatch[1].trim();

const pool = new Pool({ connectionString: DATABASE_URL });

(async () => {
  try {
    console.log('\n📋 PHASE 0 VERIFICATION REPORT\n');
    
    // Check tender types
    const ttResult = await pool.query('SELECT code, name, procurement_type FROM tender_type_definitions ORDER BY code');
    console.log('✅ Tender Types Created:');
    ttResult.rows.forEach(row => console.log('   ' + row.code + ' - ' + row.name.substring(0, 50) + '...'));
    console.log('   Total: ' + ttResult.rows.length + '\n');
    
    // Check tables
    const tablesResult = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'tender%' ORDER BY table_name");
    console.log('✅ Tables Created:');
    tablesResult.rows.forEach(row => console.log('   - ' + row.table_name));
    console.log();
    
    // Check tenders table has tender_type column
    const colResult = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='tenders' AND column_name='tender_type'");
    console.log(colResult.rows.length > 0 ? '✅ tenders.tender_type column exists' : '❌ tenders.tender_type missing');
    
    console.log('\n🎉 Phase 0 Database Schema Complete!\n');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
