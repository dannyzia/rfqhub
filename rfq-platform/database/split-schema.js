/**
 * Split SQL Schema into Neon-Friendly Chunks
 *
 * Neon SQL Editor has a limit of ~187 lines per execution.
 * This script splits the schema file into smaller parts that can be
 * executed sequentially in the Neon SQL Editor.
 *
 * Usage:
 *   node split-schema.js
 *
 * Output:
 *   - part1-extensions-and-companies.sql
 *   - part2-users-and-auth.sql
 *   - part3-rfqs.sql
 *   - part4-quotations.sql
 *   - part5-comparisons-and-orders.sql
 *   - part6-notifications-and-audit.sql
 *   - part7-indexes-and-triggers.sql
 */

const fs = require('fs');
const path = require('path');

// Path to the original schema file
const SCHEMA_FILE = path.join(__dirname, '../../Instructions/rfq_tendering_platform_schema_v3.sql');
const OUTPUT_DIR = path.join(__dirname);

// Maximum lines per chunk (Neon limit is ~187, we use 180 to be safe)
const MAX_LINES_PER_CHUNK = 180;

console.log('🔧 SQL Schema Splitter for Neon');
console.log('================================\n');

// Check if schema file exists
if (!fs.existsSync(SCHEMA_FILE)) {
  console.error('❌ Error: Schema file not found at:', SCHEMA_FILE);
  console.error('   Please ensure the file exists in the Instructions folder.');
  process.exit(1);
}

// Read the schema file
const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
const lines = schemaContent.split('\n');

console.log(`📄 Original schema: ${lines.length} lines\n`);

// Define logical split points based on SQL comments and structure
const splitPoints = [
  {
    name: 'part1-extensions-and-companies',
    description: 'Extensions, Companies & Organizations',
    startPattern: /CREATE EXTENSION/i,
    endPattern: /-- 2\. USERS/i,
    beforeLine: true
  },
  {
    name: 'part2-users-and-auth',
    description: 'Users, Authentication & Profiles',
    startPattern: /-- 2\. USERS/i,
    endPattern: /-- 3\. RFQ/i,
    beforeLine: true
  },
  {
    name: 'part3-rfqs',
    description: 'RFQs and Line Items',
    startPattern: /-- 3\. RFQ/i,
    endPattern: /-- 4\. QUOTATION/i,
    beforeLine: true
  },
  {
    name: 'part4-quotations',
    description: 'Quotations and Responses',
    startPattern: /-- 4\. QUOTATION/i,
    endPattern: /-- 5\. COMPARISON/i,
    beforeLine: true
  },
  {
    name: 'part5-comparisons-and-orders',
    description: 'Comparisons, Orders & Documents',
    startPattern: /-- 5\. COMPARISON/i,
    endPattern: /-- 6\. NOTIFICATION/i,
    beforeLine: true
  },
  {
    name: 'part6-notifications-and-audit',
    description: 'Notifications, Audit & Activity Logs',
    startPattern: /-- 6\. NOTIFICATION/i,
    endPattern: /CREATE INDEX|-- INDEX/i,
    beforeLine: true
  },
  {
    name: 'part7-indexes-and-triggers',
    description: 'Indexes, Triggers & Constraints',
    startPattern: /CREATE INDEX|-- INDEX/i,
    endPattern: null, // Till end of file
    beforeLine: false
  }
];

// Alternative approach: Simple line-based splitting if patterns don't work
function splitByLines(lines, maxLines) {
  const chunks = [];
  let currentChunk = [];
  let chunkNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    currentChunk.push(lines[i]);

    if (currentChunk.length >= maxLines || i === lines.length - 1) {
      chunks.push({
        name: `part${chunkNumber}-schema-chunk`,
        description: `Schema Part ${chunkNumber}`,
        content: currentChunk.join('\n')
      });
      currentChunk = [];
      chunkNumber++;
    }
  }

  return chunks;
}

// Extract chunks based on split points
function extractChunks(lines, splitPoints) {
  const chunks = [];

  for (let i = 0; i < splitPoints.length; i++) {
    const current = splitPoints[i];
    const next = splitPoints[i + 1];

    // Find start line
    let startLine = 0;
    for (let j = 0; j < lines.length; j++) {
      if (current.startPattern.test(lines[j])) {
        startLine = j;
        break;
      }
    }

    // Find end line
    let endLine = lines.length - 1;
    if (next) {
      for (let j = startLine + 1; j < lines.length; j++) {
        if (next.startPattern.test(lines[j])) {
          endLine = current.beforeLine ? j - 1 : j;
          break;
        }
      }
    }

    const chunkLines = lines.slice(startLine, endLine + 1);

    chunks.push({
      name: current.name,
      description: current.description,
      content: chunkLines.join('\n'),
      lineCount: chunkLines.length
    });
  }

  return chunks;
}

// Try pattern-based splitting first
let chunks = [];
try {
  chunks = extractChunks(lines, splitPoints);

  // Check if any chunk is too large
  const tooLarge = chunks.filter(c => c.lineCount > MAX_LINES_PER_CHUNK);

  if (tooLarge.length > 0) {
    console.log('⚠️  Some chunks are too large for Neon, using line-based splitting...\n');
    chunks = splitByLines(lines, MAX_LINES_PER_CHUNK);
  }
} catch (error) {
  console.log('⚠️  Pattern-based splitting failed, using line-based splitting...\n');
  chunks = splitByLines(lines, MAX_LINES_PER_CHUNK);
}

// Create output files
console.log('📝 Creating split files:\n');

const executionOrder = [];

chunks.forEach((chunk, index) => {
  const filename = `${chunk.name}.sql`;
  const filepath = path.join(OUTPUT_DIR, filename);

  // Add header to each file
  const header = `-- =====================================================================
-- ${chunk.description || `Schema Part ${index + 1}`}
-- Part ${index + 1} of ${chunks.length}
-- Auto-generated for Neon SQL Editor (max 187 lines per execution)
-- =====================================================================
-- EXECUTION ORDER: Run parts in sequence (part1 → part2 → part3 → etc.)
-- =====================================================================

`;

  const content = header + chunk.content;

  fs.writeFileSync(filepath, content, 'utf-8');

  console.log(`   ✅ ${filename} (${chunk.lineCount || chunk.content.split('\n').length} lines)`);

  executionOrder.push({
    order: index + 1,
    filename: filename,
    description: chunk.description || `Schema Part ${index + 1}`,
    lines: chunk.lineCount || chunk.content.split('\n').length
  });
});

// Create execution guide
const guideContent = `# 📖 Neon SQL Execution Guide

## ⚠️ Important: Execute in Order!

The schema has been split into ${chunks.length} parts to fit within Neon's SQL Editor limit (~187 lines).

**You MUST execute these files in the exact order listed below:**

${executionOrder.map(item => `
### ${item.order}. ${item.filename}
- **Description:** ${item.description}
- **Lines:** ${item.lines}
- **Status:** ⏳ Pending

**Steps:**
1. Open Neon SQL Editor: https://console.neon.tech
2. Copy the contents of \`${item.filename}\`
3. Paste into the SQL Editor
4. Click **"Run"** or press \`Ctrl+Enter\`
5. Wait for success message
6. ✅ Mark as complete

---
`).join('\n')}

## 🔍 Verification

After executing all parts, verify the schema is complete:

\`\`\`sql
-- Check total table count (should be ~15-20 tables)
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
\`\`\`

Expected tables:
- companies
- users
- rfqs
- rfq_items
- quotations
- quotation_items
- rfq_comparisons
- supplier_invitations
- documents
- notifications
- activity_logs
- audit_logs
- And more...

## ❌ Troubleshooting

**Error: "relation already exists"**
- Some tables were created in a previous run
- Either drop existing tables or skip the erroring part
- To start fresh: \`DROP SCHEMA public CASCADE; CREATE SCHEMA public;\`

**Error: "syntax error"**
- Make sure you copied the entire file content
- Check for missing/extra characters
- Verify you're running parts in order

**Error: "permission denied"**
- Check you're connected to the correct database
- Verify your user has CREATE permissions

## ✅ Success Criteria

After all parts execute successfully:
- [ ] No errors in SQL Editor
- [ ] All ${executionOrder.length} parts executed
- [ ] Table count matches expected (~15-20)
- [ ] Can query tables: \`SELECT * FROM users LIMIT 1;\`

---

**Generated:** ${new Date().toISOString()}
**Original Schema:** ${lines.length} lines
**Split Into:** ${chunks.length} parts
**Max Lines Per Part:** ${MAX_LINES_PER_CHUNK}
`;

const guidePath = path.join(OUTPUT_DIR, 'EXECUTION_GUIDE.md');
fs.writeFileSync(guidePath, guideContent, 'utf-8');

console.log(`\n📖 ${executionOrder.length + 1}. EXECUTION_GUIDE.md (instructions)\n`);

// Create a single-file alternative for psql
const psqlContent = `-- =====================================================================
-- COMPLETE SCHEMA - FOR PSQL COMMAND LINE ONLY
-- =====================================================================
-- This is the original schema in one file.
-- Use this ONLY if running via psql command line:
--   psql "your-connection-string" -f complete-schema.sql
--
-- For Neon SQL Editor, use the split parts (part1, part2, etc.)
-- =====================================================================

${schemaContent}
`;

const psqlPath = path.join(OUTPUT_DIR, 'complete-schema.sql');
fs.writeFileSync(psqlPath, psqlContent, 'utf-8');

console.log(`   📦 complete-schema.sql (${lines.length} lines - for psql only)\n`);

// Summary
console.log('================================');
console.log('✅ Schema split completed!\n');
console.log('📁 Output files:');
console.log(`   Location: ${OUTPUT_DIR}\n`);
console.log('🚀 Next Steps:');
console.log('   1. Read EXECUTION_GUIDE.md');
console.log('   2. Open Neon SQL Editor');
console.log('   3. Execute part1, part2, part3... in order');
console.log('   4. Verify all tables created\n');
console.log('💡 Tip: For command line, use complete-schema.sql with psql');
console.log('================================\n');
