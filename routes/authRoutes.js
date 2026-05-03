// ===================================
// routes/authRoutes.js
// กำหนด URL สำหรับ Register และ Login
// ===================================

const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register → ไปที่ authController.register
router.post('/register', authController.register);

// POST /api/auth/login → ไปที่ authController.login
router.post('/login', authController.login);

module.exports = router;
