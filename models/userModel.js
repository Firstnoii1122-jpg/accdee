const db = require('../config/db');

const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT id, username, email, password, balance, role, telegram_chat_id, two_fa_enabled, token_version FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

const findUserByUsername = async (username) => {
  const [rows] = await db.execute(
    'SELECT id, username, email, password, balance, role, telegram_chat_id, two_fa_enabled, token_version FROM users WHERE username = ?',
    [username]
  );
  return rows[0];
};

const findUserByEmailOrUsername = async (identifier) => {
  const [rows] = await db.execute(
    'SELECT id, username, email, password, balance, role, telegram_chat_id, two_fa_enabled, token_version FROM users WHERE email = ? OR username = ? LIMIT 1',
    [identifier.toLowerCase(), identifier]
  );
  return rows[0];
};

const findUserById = async (id) => {
  const [rows] = await db.execute(
    'SELECT id, username, email, balance, role, created_at, token_version FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
};

const incrementTokenVersion = async (userId) => {
  await db.execute('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [userId]);
};

const createUser = async (username, email, hashedPassword) => {
  const [result] = await db.execute(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );
  return result.insertId;
};

module.exports = { findUserByEmail, findUserByUsername, findUserByEmailOrUsername, findUserById, createUser, incrementTokenVersion };
