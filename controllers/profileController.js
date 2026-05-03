// ===================================
// controllers/profileController.js
// จัดการข้อมูล Profile ของ User
// ===================================

const User = require('../models/userModel');

// GET /api/profile
// ดึงข้อมูล profile ของ user ที่ login อยู่
const getProfile = async (req, res) => {
  try {
    // req.user.id มาจาก authMiddleware ที่ถอดรหัส token ให้แล้ว
    const user = await User.findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data   : user  // ไม่มี password เพราะ findUserById ไม่ได้ select มา
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again'
    });
  }
};

module.exports = { getProfile };
