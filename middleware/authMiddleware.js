// ===================================
// middleware/authMiddleware.js
// ตรวจสอบ JWT Token ก่อนเข้า Protected Route
// ===================================

const jwt = require('jsonwebtoken');

// ===================================
// protect - middleware ตรวจสอบ token
// ใส่ไว้หน้า route ไหน = route นั้นต้องมี token ถึงเข้าได้
// ===================================
const protect = (req, res, next) => {
  try {
    // ดึง token จาก Header
    // รูปแบบ Header ที่ถูกต้อง: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];

    // ตรวจว่ามี Header และขึ้นต้นด้วย "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied'
      });
    }

    // ตัด "Bearer " ออก เหลือแค่ตัว token
    // "Bearer eyJhbGci..." → "eyJhbGci..."
    const token = authHeader.split(' ')[1];

    // ตรวจสอบและถอดรหัส token
    // ถ้า token ผิด หรือหมดอายุ จะ throw error อัตโนมัติ
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // เก็บข้อมูล user ที่ถอดได้จาก token ไว้ใน req
    // ให้ controller ถัดไปเรียกใช้ได้ผ่าน req.user
    req.user = decoded; // มี id และ role ของ user

    // ผ่านการตรวจแล้ว → ไปต่อที่ controller ถัดไป
    next();

  } catch (error) {
    // token หมดอายุ
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please login again'
      });
    }

    // token ไม่ถูกต้อง (ถูกแก้ไข หรือปลอม)
    return res.status(401).json({
      success: false,
      message: 'Invalid token, access denied'
    });
  }
};

module.exports = { protect };
