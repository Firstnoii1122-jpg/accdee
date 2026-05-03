const express          = require('express');
const router           = express.Router();
const { adminOnly }    = require('../middleware/adminMiddleware');
const adminController  = require('../controllers/adminController');

router.get('/topups',              adminOnly, adminController.getPendingTopups);
router.post('/topups/:id/approve', adminOnly, adminController.approveTopup);
router.post('/topups/:id/reject',  adminOnly, adminController.rejectTopup);

module.exports = router;
