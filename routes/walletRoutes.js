const express          = require('express');
const router           = express.Router();
const multer           = require('multer');
const { protect }      = require('../middleware/authMiddleware');
const walletController = require('../controllers/walletController');

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดรูปภาพ (.jpg, .png, .webp) เท่านั้น'), false);
  }
};

// เก็บไฟล์ใน memory แล้วส่งต่อไป Cloudinary
const upload = multer({
  storage : multer.memoryStorage(),
  fileFilter,
  limits  : { fileSize: 5 * 1024 * 1024 }
});

router.get('/info',         protect, walletController.getWalletInfo);
router.get('/payment-info',          walletController.getPaymentInfo);
router.post('/topup',       protect, upload.single('slip'), walletController.requestTopup);
router.get('/history',      protect, walletController.getHistory);

module.exports = router;
