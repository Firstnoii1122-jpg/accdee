// ===================================
// models/userModel.js - จัดการข้อมูล User ในฐานข้อมูล
// ===================================

const db = require('../config/db');

// ค้นหา user ด้วย email
// ใช้ตอน login และตรวจสอบ email ซ้ำ
const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]  // ? = placeholder ป้องกัน SQL Injection
  );
  return rows[0]; // คืนค่า user คนแรก หรือ undefined ถ้าไม่เจอ
};

// ค้นหา user ด้วย id
// ใช้ตอนดึงข้อมูล profile
const findUserById = async (id) => {
  const [rows] = await db.execute(
    'SELECT id, username, email, balance, role, created_at FROM users WHERE id = ?',
    [id]  // ไม่ select password เพื่อความปลอดภัย
  );
  return rows[0];
};

// สร้าง user ใหม่ (Register)
const createUser = async (username, email, hashedPassword) => {
  const [result] = await db.execute(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );
  return result.insertId; // คืนค่า id ของ user ที่เพิ่งสร้าง
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};
