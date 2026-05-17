const { protect } = require('./authMiddleware');
const { logSecurityEvent } = require('../utils/securityLogger');

// ต้อง login + ต้องเป็น admin เท่านั้น
const adminOnly = (req, res, next) => {
  if (!req.headers['authorization']) {
    logSecurityEvent('admin.access_missing_token', req);
  }

  protect(req, res, () => {
    if (req.user.role !== 'admin') {
      logSecurityEvent('admin.access_forbidden', req, { userId: req.user.id, role: req.user.role });
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  });
};

module.exports = { adminOnly };
