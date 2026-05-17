const { verifyJwt } = require('../utils/jwtConfig');

const protect = (req, res, next) => {
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
