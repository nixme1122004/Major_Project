const mysql = require('mysql2/promise');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const connectionConfig = databaseUrl
  ? databaseUrl
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

if (!databaseUrl && !(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)) {
  console.warn('⚠️ No database connection settings detected. Set DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME.');
}

const pool = mysql.createPool(connectionConfig);

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
  }
})();

module.exports = pool;
