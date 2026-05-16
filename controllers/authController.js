const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const crypto           = require('crypto');
const db               = require('../config/db');
const User             = require('../models/userModel');
const { sendTelegram } = require('../config/telegram');
const { sendEmail }    = require('../config/email');

const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_ก-๙]{3,30}$/;

const register = async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
    }
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้ต้องมี 3-30 ตัวอักษร (ตัวอักษร ตัวเลข _ หรือภาษาไทย)' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }

    const existingEmail = await User.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }
    const existingUsername = await User.findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
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
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const user = await User.findUserByEmail(email);
    const passwordMatch = user && await bcrypt.compare(password, user.password);

    if (!user || !passwordMatch) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // ถ้าเปิด 2FA → ส่ง OTP แล้ว return tempToken แทน JWT จริง
    if (user.two_fa_enabled) {
      const otp     = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 นาที

      await db.execute(
        'UPDATE users SET two_fa_otp = ?, two_fa_expires = ? WHERE id = ?',
        [otp, expires, user.id]
      );

      await sendEmail({
        to     : user.email,
        subject: '[ACCDEE] รหัส OTP สำหรับเข้าสู่ระบบ',
        html   : `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
            <h2 style="color:#4f46e5">รหัส OTP ของคุณ</h2>
            <p>สวัสดี <b>${user.username}</b></p>
            <p>รหัส OTP สำหรับเข้าสู่ระบบ ACCDEE:</p>
            <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#4f46e5;text-align:center;padding:20px;background:#f5f3ff;border-radius:8px;margin:16px 0">${otp}</div>
            <p style="color:#888;font-size:12px">รหัสนี้หมดอายุใน 5 นาที<br>หากคุณไม่ได้ล็อกอิน กรุณาเปลี่ยนรหัสผ่านทันที</p>
          </div>`
      });

      // tempToken ใช้แทน JWT จริง — payload บอกว่ายัง pending 2FA
      const tempToken = jwt.sign(
        { id: user.id, pending2FA: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      return res.json({ success: true, requires2FA: true, tempToken });
    }

    // ไม่มี 2FA → login ปกติ
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      data: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

// POST /api/auth/verify-otp — ยืนยัน OTP แลก JWT จริง
const verifyOtp = async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    if (!tempToken || !otp) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบ' });
    }

    // ตรวจ tempToken
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    if (!decoded.pending2FA) {
      return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง' });
    }

    const user = await User.findUserById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้' });

    // ตรวจ OTP
    if (!user.two_fa_otp || String(otp).trim() !== user.two_fa_otp) {
      return res.status(401).json({ success: false, message: 'รหัส OTP ไม่ถูกต้อง' });
    }
    if (!user.two_fa_expires || new Date() > new Date(user.two_fa_expires)) {
      return res.status(401).json({ success: false, message: 'รหัส OTP หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่' });
    }

    // clear OTP
    await db.execute('UPDATE users SET two_fa_otp = NULL, two_fa_expires = NULL WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      data: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance }
    });

  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    const hashed    = await bcrypt.hash(newPassword, 12);

    await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    await db.execute('DELETE FROM password_resets WHERE token = ?', [token]);

    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสใหม่' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  }
};

module.exports = { register, login, verifyOtp, forgotPassword, resetPassword };
