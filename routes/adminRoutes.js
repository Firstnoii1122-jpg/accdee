const express         = require('express');
const router          = express.Router();
const { adminOnly }   = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

router.get('/stats',               adminOnly, adminController.getStats);
router.get('/members',             adminOnly, adminController.getMembers);
router.post('/members/:id/credit', adminOnly, adminController.adjustCredit);
router.get('/topups',              adminOnly, adminController.getPendingTopups);
router.get('/topups/history',      adminOnly, adminController.getTopupHistory);
router.post('/topups/:id/approve', adminOnly, adminController.approveTopup);
router.post('/topups/:id/reject',  adminOnly, adminController.rejectTopup);

module.exports = router;
