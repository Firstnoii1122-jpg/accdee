const db = require('../config/db');
const Transaction = require('../models/transactionModel');

const getPendingTopups = async (req, res) => {
  try {
    const rows = await Transaction.getPending();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPendingTopups error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const approveTopup = async (req, res) => {
  try {
    const tx = await Transaction.getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }
    await Transaction.approveTopup(tx.id, tx.user_id, tx.amount);
    res.json({ success: true, message: 'Approved and balance updated' });
  } catch (err) {
    console.error('approveTopup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const rejectTopup = async (req, res) => {
  try {
    const tx = await Transaction.getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }
    await Transaction.rejectTopup(tx.id);
    res.json({ success: true, message: 'Rejected' });
  } catch (err) {
    console.error('rejectTopup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/stats — สถิติสำหรับ dashboard
const getStats = async (req, res) => {
  try {
    const [[{ totalMembers }]] = await db.execute(
      "SELECT COUNT(*) as totalMembers FROM users WHERE role = 'user'"
    );
    const [[{ newToday }]] = await db.execute(
      "SELECT COUNT(*) as newToday FROM users WHERE role = 'user' AND DATE(created_at) = CURDATE()"
    );
    const [[{ pendingCount }]] = await db.execute(
      "SELECT COUNT(*) as pendingCount FROM transactions WHERE status = 'pending'"
    );
    const [[{ topupToday }]] = await db.execute(
      "SELECT COALESCE(SUM(amount),0) as topupToday FROM transactions WHERE type='topup' AND status='approved' AND DATE(created_at)=CURDATE()"
    );
    const [recentTransactions] = await db.execute(
      `SELECT t.id, t.amount, t.type, t.status, t.created_at,
              u.username, u.email
       FROM transactions t JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC LIMIT 10`
    );
    res.json({
      success: true,
      data: { totalMembers, newToday, pendingCount, topupToday: parseFloat(topupToday), recentTransactions }
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/members — รายชื่อสมาชิกทั้งหมด
const getMembers = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = "SELECT id, username, email, balance, created_at FROM users WHERE role = 'user'";
    const params = [];
    if (search) {
      sql += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMembers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/members/:id/credit — ปรับยอดเงินสมาชิก
const adjustCredit = async (req, res) => {
  const { amount, type, note } = req.body;
  const userId = parseInt(req.params.id);

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'จำนวนเงินไม่ถูกต้อง' });
  }
  if (!['deposit', 'withdraw'].includes(type)) {
    return res.status(400).json({ success: false, message: 'ประเภทไม่ถูกต้อง' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.execute('SELECT id, balance FROM users WHERE id = ?', [userId]);
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบสมาชิก' });
    }

    const delta = type === 'deposit' ? parseFloat(amount) : -parseFloat(amount);
    const newBalance = parseFloat(user.balance) + delta;
    if (newBalance < 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'ยอดเงินไม่เพียงพอ' });
    }

    await conn.execute('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);
    await conn.execute(
      "INSERT INTO transactions (user_id, amount, type, status, note) VALUES (?, ?, 'topup', 'approved', ?)",
      [userId, Math.abs(parseFloat(amount)), note || `Admin ${type}`]
    );
    await conn.commit();
    res.json({ success: true, message: `ปรับยอดเงินสำเร็จ ยอดใหม่: ${newBalance.toFixed(2)} ฿` });
  } catch (err) {
    await conn.rollback();
    console.error('adjustCredit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

// GET /api/admin/topups/history — ประวัติ topup ทั้งหมด
const getTopupHistory = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT t.id, t.amount, t.type, t.status, t.note, t.slip_image, t.created_at,
              u.username, u.email
       FROM transactions t JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getTopupHistory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPendingTopups, approveTopup, rejectTopup, getStats, getMembers, adjustCredit, getTopupHistory };
