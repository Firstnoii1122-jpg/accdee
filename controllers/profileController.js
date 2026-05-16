const bcrypt = require('bcryptjs');
const db     = require('../config/db');
const User   = require('../models/userModel');

const usernameRegex = /^[a-zA-Z0-9_ก-๙]{3,30}$/;

const getProfile = async (req, res) => {
  try {
    const user = await User.findUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUsername = async (req, res) => {
  const newUsername = (req.body.username || '').trim();
  if (!usernameRegex.test(newUsername)) {
    return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้ต้องมี 3-30 ตัวอักษร (ตัวอักษร ตัวเลข _ หรือภาษาไทย)' });
  }
  try {
    const [[existing]] = await db.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [newUsername, req.user.id]
    );
    if (existing) return res.status(409).json({ success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });

    await db.execute('UPDATE users SET username = ? WHERE id = ?', [newUsername, req.user.id]);
    res.json({ success: true, message: 'เปลี่ยนชื่อผู้ใช้สำเร็จ', username: newUsername });
  } catch (err) {
    console.error('updateUsername error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const currentPassword = req.body.currentPassword || '';
  const newPassword     = req.body.newPassword     || '';

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
  }
  try {
    const [[user]] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getProfile, updateUsername, changePassword };
