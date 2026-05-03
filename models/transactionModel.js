// ===================================
// models/transactionModel.js
// จัดการข้อมูล Transactions ในฐานข้อมูล
// ===================================

const db = require('../config/db');

// สร้างคำขอเติมเงินใหม่ (status = pending รอ Admin อนุมัติ)
const createTopup = async (userId, amount, slipImage, note) => {
  const [result] = await db.execute(
    `INSERT INTO transactions (user_id, amount, type, status, slip_image, note)
     VALUES (?, ?, 'topup', 'pending', ?, ?)`,
    [userId, amount, slipImage, note]
  );
  return result.insertId;
};

// ดึงประวัติธุรกรรมทั้งหมดของ user คนนั้น
const getByUserId = async (userId) => {
  const [rows] = await db.execute(
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

// ดึงรายการรอ Admin อนุมัติทั้งหมด (สำหรับ Admin)
const getPending = async () => {
  const [rows] = await db.execute(
    `SELECT t.*, u.username, u.email
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     WHERE t.status = 'pending'
     ORDER BY t.created_at ASC`
  );
  return rows;
};

// ดึงข้อมูล transaction จาก id (ตรวจก่อน approve)
const getById = async (id) => {
  const [rows] = await db.execute(
    'SELECT * FROM transactions WHERE id = ?',
    [id]
  );
  return rows[0];
};

// Admin อนุมัติ → เปลี่ยน status + เพิ่ม balance ให้ user
// ใช้ transaction เพื่อให้ทั้ง 2 คำสั่งสำเร็จพร้อมกัน หรือ rollback ถ้าเกิด error
const approveTopup = async (transactionId, userId, amount) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. เปลี่ยนสถานะเป็น approved
    await conn.execute(
      `UPDATE transactions SET status = 'approved' WHERE id = ?`,
      [transactionId]
    );

    // 2. เพิ่ม balance ให้ user
    await conn.execute(
      `UPDATE users SET balance = balance + ? WHERE id = ?`,
      [amount, userId]
    );

    await conn.commit();
  } catch (error) {
    // ถ้าเกิดข้อผิดพลาด ยกเลิกทุกอย่าง ป้องกันเงินหาย
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Admin ปฏิเสธ → เปลี่ยน status เป็น rejected
const rejectTopup = async (transactionId) => {
  await db.execute(
    `UPDATE transactions SET status = 'rejected' WHERE id = ?`,
    [transactionId]
  );
};

module.exports = {
  createTopup,
  getByUserId,
  getPending,
  getById,
  approveTopup,
  rejectTopup
};
