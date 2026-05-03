// ===================================
// controllers/authController.js
// จัดการ Logic การสมัครสมาชิกและเข้าสู่ระบบ
// ===================================

const bcrypt = require('bcryptjs');       // สำหรับเข้ารหัส password
const jwt    = require('jsonwebtoken');   // สำหรับสร้าง token
const User   = require('../models/userModel'); // ดึง functions จัดการ DB

// ===================================
// REGISTER - สมัครสมาชิก
// POST /api/auth/register
// ===================================
const register = async (req, res) => {
  try {
    // ดึงข้อมูลที่ user ส่งมา และตัดช่องว่างหน้า-หลังออก
    const username = (req.body.username || '').trim();
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    // --- Validation: ตรวจสอบข้อมูลเบื้องต้น ---
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }

    // ตรวจรูปแบบ email ว่าถูกต้องไหม เช่น user@example.com
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // --- ตรวจสอบว่า email ซ้ำไหม ---
    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // --- เข้ารหัส password ด้วย bcrypt ---
    // เลข 10 = ความซับซ้อนในการเข้ารหัส (salt rounds)
    // ยิ่งมาก ยิ่งปลอดภัย แต่ช้ากว่า — 10 เหมาะสมพอดี
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- บันทึก user ลงฐานข้อมูล ---
    const newUserId = await User.createUser(username, email, hashedPassword);

    // --- ตอบกลับ ---
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        id      : newUserId,
        username: username,
        email   : email
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again'
    });
  }
};

// ===================================
// LOGIN - เข้าสู่ระบบ
// POST /api/auth/login
// ===================================
const login = async (req, res) => {
  try {
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    // --- Validation ---
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // --- ค้นหา user จาก email ---
    const user = await User.findUserByEmail(email);
    if (!user) {
      // ไม่บอกว่า "email ไม่มีในระบบ" เพื่อความปลอดภัย
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // --- เปรียบเทียบ password ที่พิมพ์มา กับ hash ในฐานข้อมูล ---
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // --- สร้าง JWT Token ---
    // token เก็บ id และ role ของ user ไว้ข้างใน
    const token = jwt.sign(
      { id: user.id, role: user.role },  // ข้อมูลที่ฝังใน token
      process.env.JWT_SECRET,            // key ลับสำหรับเซ็น token
      { expiresIn: process.env.JWT_EXPIRES_IN } // อายุ token = 7 วัน
    );

    // --- ตอบกลับ พร้อม token ---
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token  : token,
      data   : {
        id      : user.id,
        username: user.username,
        email   : user.email,
        role    : user.role,
        balance : user.balance
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again'
    });
  }
};

module.exports = { register, login };
