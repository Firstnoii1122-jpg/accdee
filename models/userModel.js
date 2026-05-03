const db = require('../config/db');

const findUserByEmail = async (email) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const findUserById = async (id) => {
  const [rows] = await db.execute(
    'SELECT id, username, email, balance, role, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
};

const createUser = async (username, email, hashedPassword) => {
  const [result] = await db.execute(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );
  return result.insertId;
};

module.exports = { findUserByEmail, findUserById, createUser };
