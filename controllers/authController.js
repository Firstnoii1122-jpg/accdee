const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const crypto           = require('crypto');
const db               = require('../config/db');
const User             = require('../models/userModel');
const { sendTelegram } = require('../config/telegram');
const { sendEmail }    = require('../config/email');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email and password' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId      = await User.createUser(username, email, hashedPassword);

    sendTelegram(`🆕 <b>สมาชิกใหม่!</b>\n👤 ${username}\n📧 ${email}`);

    sendEmail({
      to     : email,
      subject: 'ยินดีต้อนรับสู่ Accdee!',
      html   : `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#4f46e5">ยินดีต้อนรับ, ${username}! 🎉</h2>
          <p>สมัครสมาชิกสำเร็จแล้วครับ</p>
          <p>คุณสามารถเข้าสู่ระบบและเติมเงินเพื่อเริ่มใช้งานได้เลย</p>
          <a href="https://www.accdee.shop" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">เข้าสู่เว็บไซต์</a>
          <p style="margin-top:24px;color:#888;font-size:12px">หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลนี้</p>
        </div>
      `
    });

    sendEmail({
      to     : process.env.ADMIN_EMAIL,
      subject: `[Accdee] สมาชิกใหม่: ${username}`,
      html   : `<p>มีสมาชิกใหม่สมัครเข้ามา</p><p>👤 <b>${username}</b><br>📧 ${email}</p>`
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data   : { id: newUserId, username, email }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

const login = async (req, res) => {
  try {
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findUserByEmail(email);
    const passwordMatch = user && await bcrypt.compare(password, user.password);

    if (!user || !passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลที่ถูกต้อง' });
    }

    const user = await User.findUserByEmail(email);
    // ตอบ success เสมอ เพื่อไม่ให้รู้ว่า email มีในระบบหรือเปล่า
    if (!user) {
      return res.json({ success: true, message: 'หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตให้ทันที' });
    }

    // ลบ token เก่าของ email นี้ก่อน (ถ้ามี)
    await db.execute('DELETE FROM password_resets WHERE email = ?', [email]);

    // สร้าง token ใหม่ (hex 32 bytes = 64 ตัวอักษร)
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ชั่วโมง

    await db.execute(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt]
    );

    const siteUrl   = process.env.SITE_URL || 'https://www.accdee.shop';
    const resetLink = `${siteUrl}/reset-password.html?token=${token}`;

    await sendEmail({
      to     : email,
      subject: '[Accdee] รีเซ็ตรหัสผ่านของคุณ',
      html   : `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#4f46e5">รีเซ็ตรหัสผ่าน</h2>
          <p>สวัสดีครับ, เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี <b>${email}</b></p>
          <p>คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์หมดอายุใน 1 ชั่วโมง)</p>
          <a href="${resetLink}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">ตั้งรหัสผ่านใหม่</a>
          <p style="margin-top:24px;color:#888;font-size:12px">หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
        </div>
      `
    });

    res.json({ success: true, message: 'ส่งลิงก์รีเซ็ตไปที่อีเมลแล้ว! ตรวจสอบกล่องจดหมาย (รวมถึง spam)' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token       = (req.body.token    || '').trim();
    const newPassword = (req.body.password || '');

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const [rows] = await db.execute(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    const { email } = rows[0];
    const hashed    = await bcrypt.hash(newPassword, 10);

    await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    await db.execute('DELETE FROM password_resets WHERE token = ?', [token]);

    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสใหม่' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
