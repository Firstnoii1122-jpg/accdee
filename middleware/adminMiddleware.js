const { protect } = require('./authMiddleware');

// ต้อง login + ต้องเป็น admin เท่านั้น
const adminOnly = (req, res, next) => {
  protect(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  });
};

module.exports = { adminOnly };
