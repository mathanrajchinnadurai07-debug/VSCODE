/* ============================================================
   Curfee — MySQL Connection Pool
   Uses mysql2/promise for async/await support
   ============================================================ */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     || 'localhost',
  port:     process.env.MYSQL_PORT     || 3306,
  user:     process.env.MYSQL_USER     || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'curfee',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Quick health-check function
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Connected:', conn.config.host + ':' + conn.config.port);
    conn.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL Connection Error:', err.message);
    console.log('⚠️  Server will run without database (demo mode)');
    return false;
  }
}

module.exports = { pool, testConnection };
