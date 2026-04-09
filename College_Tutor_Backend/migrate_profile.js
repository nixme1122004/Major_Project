const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('🚀 Starting migration...');
    
    // Check if columns exist first (optional but safer)
    const [columns] = await pool.query('SHOW COLUMNS FROM Students');
    const existing = columns.map(c => c.Field);
    
    if (!existing.includes('bio')) {
      await pool.query('ALTER TABLE Students ADD COLUMN bio TEXT');
      console.log('✅ Added bio column');
    }
    if (!existing.includes('location')) {
      await pool.query('ALTER TABLE Students ADD COLUMN location VARCHAR(150)');
      console.log('✅ Added location column');
    }
    if (!existing.includes('avatar')) {
      await pool.query('ALTER TABLE Students ADD COLUMN avatar LONGTEXT');
      console.log('✅ Added avatar column');
    }
    if (!existing.includes('skills_json')) {
      await pool.query('ALTER TABLE Students ADD COLUMN skills_json JSON');
      console.log('✅ Added skills_json column');
    }
    
    console.log('🎉 Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
