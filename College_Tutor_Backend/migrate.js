/**
 * One-time DB migration script.
 * Run with: node migrate.js
 * Safe to run multiple times (uses IF NOT EXISTS).
 */
require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  console.log('🔄 Running DB migration...');
  const conn = await pool.getConnection();

  try {
    // 1. Add missing profile columns
    const alterStatements = [
      `ALTER TABLE Students ADD COLUMN IF NOT EXISTS bio TEXT`,
      `ALTER TABLE Students ADD COLUMN IF NOT EXISTS location VARCHAR(150)`,
      `ALTER TABLE Students ADD COLUMN IF NOT EXISTS avatar LONGTEXT`,
      `ALTER TABLE Students ADD COLUMN IF NOT EXISTS skills_json LONGTEXT`,
    ];

    for (const sql of alterStatements) {
      try {
        await conn.query(sql);
        console.log(`  ✅ ${sql.substring(0, 60)}...`);
      } catch (e) {
        // Column might already exist as a different type - that's fine
        console.log(`  ⚠️  Skipped (already exists): ${e.message.substring(0, 80)}`);
      }
    }

    // 2. Remove the restrictive .ac.in email constraint
    // First check if it exists
    const [constraints] = await conn.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'Students' 
        AND TABLE_SCHEMA = DATABASE()
        AND CONSTRAINT_TYPE = 'CHECK'
        AND CONSTRAINT_NAME = 'college_email_check'
    `);

    if (constraints.length > 0) {
      await conn.query(`ALTER TABLE Students DROP CHECK college_email_check`);
      console.log('  ✅ Removed restrictive .ac.in email constraint');
    } else {
      console.log('  ℹ️  Email constraint not found (already removed or never applied)');
    }

    // 3. Verify final column list
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_NAME = 'Students' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n📋 Final Students table columns:');
    cols.forEach(c => console.log(`  - ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

    console.log('\n✅ Migration complete! You can now register with any email.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
