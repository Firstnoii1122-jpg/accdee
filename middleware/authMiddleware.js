const db           = require('../config/db');
const { verifyJwt } = require('../utils/jwtConfig');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided, access denied' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    const decoded = verifyJwt(parts[1]);

    // ปฏิเสธ tempToken (2FA pending) — ต้อง verify OTP ก่อน
    if (decoded.pending2FA) {
      return res.status(401).json({ success: false, message: 'Please complete 2FA verification first' });
    }

    // ตรวจ token_version — ถ้า token มี tv field ต้องตรงกับ DB
    // tokens เก่า (ไม่มี tv) ผ่านได้จนกว่าจะหมดอายุเอง
    if (decoded.tv !== undefined) {
      const [rows] = await db.execute('SELECT token_version FROM users WHERE id = ?', [decoded.id]);
      if (!rows[0] || rows[0].token_version !== decoded.tv) {
        return res.status(401).json({ success: false, message: 'Session expired, please login again' });
      }
    }

    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired, please login again' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token, access denied' });
  }
};

module.exports = { protect };
