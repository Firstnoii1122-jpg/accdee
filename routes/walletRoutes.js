const express          = require('express');
const router           = express.Router();
const multer           = require('multer');
const path             = require('path');
const { protect }      = require('../middleware/authMiddleware');
const walletController = require('../controllers/walletController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename   : (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `slip_${req.user.id}_${Date.now()}${ext}`);
  }
});

// ตรวจสอบ MIME type จริง ไม่ใช่แค่ extension
const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดรูปภาพ (.jpg, .png, .webp) เท่านั้น'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/info',         protect, walletController.getWalletInfo);
router.get('/payment-info',          walletController.getPaymentInfo);
router.post('/topup',       protect, upload.single('slip'), walletController.requestTopup);
router.get('/history',      protect, walletController.getHistory);

module.exports = router;
