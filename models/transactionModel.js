const db = require('../config/db');

const createTopup = async (userId, amount, slipImage, note) => {
  const [result] = await db.execute(
    `INSERT INTO transactions (user_id, amount, type, status, slip_image, note)
     VALUES (?, ?, 'topup', 'pending', ?, ?)`,
    [userId, amount, slipImage, note]
  );
  return result.insertId;
};

const getByUserId = async (userId) => {
  const [rows] = await db.execute(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

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

const getById = async (id) => {
  const [rows] = await db.execute('SELECT * FROM transactions WHERE id = ?', [id]);
  return rows[0];
};

function alreadyProcessedError() {
  const error = new Error('Transaction already processed');
  error.code = 'TOPUP_ALREADY_PROCESSED';
  return error;
}

const approveTopup = async (transactionId, userId, amount) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `UPDATE transactions SET status = 'approved' WHERE id = ? AND status = 'pending'`,
      [transactionId]
    );
    if (result.affectedRows !== 1) {
      throw alreadyProcessedError();
    }
    await conn.execute(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, userId]);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const rejectTopup = async (transactionId) => {
  const [result] = await db.execute(
    `UPDATE transactions SET status = 'rejected' WHERE id = ? AND status = 'pending'`,
    [transactionId]
  );
  if (result.affectedRows !== 1) {
    throw alreadyProcessedError();
  }
};

module.exports = { createTopup, getByUserId, getPending, getById, approveTopup, rejectTopup };
