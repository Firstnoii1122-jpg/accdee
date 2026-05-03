// ===================================
// routes/walletRoutes.js
// API Routes สำหรับระบบ Wallet
// ===================================

const express          = require('express');
const router           = express.Router();
const multer           = require('multer');
const path             = require('path');
const { protect }      = require('../middleware/authMiddleware');
const walletController = require('../controllers/walletController');

// ── ตั้งค่า multer สำหรับรับไฟล์สลิป ──
const storage = multer.diskStorage({
  // บอกว่าจะเก็บไฟล์ไว้ที่โฟลเดอร์ uploads/
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  // ตั้งชื่อไฟล์ใหม่ให้ไม่ซ้ำกัน: slip_userid_timestamp.jpg
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `slip_${req.user.id}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// กรองไฟล์ — รับแค่รูปภาพเท่านั้น
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext     = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);   // รับไฟล์
  } else {
    cb(new Error('กรุณาอัปโหลดรูปภาพ (.jpg, .png) เท่านั้น'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ 5MB
});

// ── Routes ──
// ทุก route ต้องผ่าน protect ก่อน (ต้อง login)

// ดูยอดเงินปัจจุบัน
router.get('/info', protect, walletController.getWalletInfo);

// ดูข้อมูลช่องทางชำระเงิน (ไม่ต้อง login ก็ดูได้)
router.get('/payment-info', walletController.getPaymentInfo);

// ส่งคำขอเติมเงิน + แนบสลิป
// 'slip' = ชื่อ field ในฟอร์ม HTML ที่ส่งไฟล์มา
router.post('/topup', protect, upload.single('slip'), walletController.requestTopup);

// ดูประวัติธุรกรรม
router.get('/history', protect, walletController.getHistory);

module.exports = router;
