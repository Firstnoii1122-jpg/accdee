const mysql = require('mysql2');

// Railway MySQL inject ตัวแปรชื่อ MYSQLHOST, MYSQLUSER ฯลฯ อัตโนมัติ
// .env ของเราใช้ชื่อ DB_HOST, DB_USER ฯลฯ
// บรรทัดนี้รับทั้งสองแบบ — ทำงานได้ทั้งเครื่องตัวเองและ Railway
const pool = mysql.createPool({
  host    : process.env.MYSQLHOST     || process.env.DB_HOST,
  port    : process.env.MYSQLPORT     || process.env.DB_PORT     || 3306,
  user    : process.env.MYSQLUSER     || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0
});

const db = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }
  console.log('MySQL connected successfully');
  connection.release();
});

module.exports = db;
