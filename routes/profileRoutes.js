// ===================================
// routes/profileRoutes.js
// Protected Routes — ต้องมี JWT Token ถึงเข้าได้
// ===================================

const express           = require('express');
const router            = express.Router();
const { protect }       = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

// GET /api/profile
// protect คือ middleware ที่ตรวจ token ก่อน
// ถ้าผ่าน → ไปที่ profileController.getProfile
// ถ้าไม่มี token หรือ token ผิด → ตอบ 401 ทันที ไม่ถึง controller
router.get('/profile', protect, profileController.getProfile);

module.exports = router;
