require('dotenv').config();
const pool = require('./src/config/db');
const bcrypt = require('bcrypt');

async function createDemoUser() {
  const demoEmail = 'demo@skillswap.com';
  const demoPassword = 'demo123';
  const demoName = 'Demo User';

  // Check if demo user already exists
  const [existing] = await pool.query('SELECT student_id FROM Students WHERE email = ?', [demoEmail]);
  if (existing.length > 0) {
    console.log('✅ Demo user already exists');
    process.exit(0);
  }

  const hashed = await bcrypt.hash(demoPassword, 10);
  const avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser';
  const bio = 'Hello! I am a demo account for testing the SkillSwap platform.';
  const location = 'Virtual Campus';
  const skills_json = JSON.stringify({
    offered: ['Testing', 'Debugging'],
    wanted: ['Learn everything']
  });

  await pool.query(
    `INSERT INTO Students (name, email, password_hash, college_id, department, year, avatar, bio, location, skills_json) VALUES (?, ?, ?, NULL, 'Demo', 1, ?, ?, ?, ?)`,
    [demoName, demoEmail, hashed, avatar, bio, location, skills_json]
  );
  console.log('✅ Demo user created: email=demo@skillswap.com, password=demo123');
  process.exit(0);
}

createDemoUser().catch(err => {
  console.error('❌ Error creating demo user:', err);
  process.exit(1);
});
