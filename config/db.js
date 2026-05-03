// ===================================
// config/db.js - เชื่อมต่อ MySQL
// ===================================

const mysql = require('mysql2');

// สร้าง Connection Pool
// Pool = เตรียม connection ไว้หลายเส้น รองรับผู้ใช้พร้อมกันได้
const pool = mysql.createPool({
  host     : process.env.DB_HOST,      // ที่อยู่ MySQL (ปกติคือ localhost)
  user     : process.env.DB_USER,      // ชื่อผู้ใช้ MySQL
  password : process.env.DB_PASSWORD,  // รหัสผ่าน MySQL
  database : process.env.DB_NAME,      // ชื่อ database = NewNew
  waitForConnections: true,            // รอถ้า connection เต็ม
  connectionLimit   : 10,              // เปิดได้สูงสุด 10 connection พร้อมกัน
  queueLimit        : 0                // ไม่จำกัด queue
});

// แปลง pool เป็นแบบ Promise
// ทำให้ใช้ async/await แทน callback ได้ — อ่านง่ายกว่ามาก
const db = pool.promise();

// ทดสอบการเชื่อมต่อตอน server เริ่มทำงาน
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection failed:', err.message);
    return;
  }
  console.log('MySQL connected to database:', process.env.DB_NAME);
  connection.release(); // คืน connection กลับ pool หลังทดสอบ
});

// export ให้ไฟล์อื่นเรียกใช้ได้
module.exports = db;
