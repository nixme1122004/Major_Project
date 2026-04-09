require('dotenv').config();
const pool = require('./src/config/db');

async function setupBookingsTable() {
  console.log('🔄 Setting up bookings table...');
  const conn = await pool.getConnection();

  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS bookings (
        booking_id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        learner_id INT NOT NULL,
        initiator_id INT NOT NULL,
        skill_name VARCHAR(255) NOT NULL,
        skill_id VARCHAR(100),
        milestones LONGTEXT,
        status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
        start_time DATETIME,
        end_time DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (teacher_id),
        INDEX (learner_id),
        INDEX (status)
      ) ENGINE=InnoDB;
    `;

    await conn.query(createTableSql);
    console.log('✅ Bookings table ready.');

  } catch (err) {
    console.error('❌ Failed to create bookings table:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

setupBookingsTable();
