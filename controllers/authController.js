const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
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

module.exports = { register, login };
