// ===================================
// controllers/walletController.js
// จัดการระบบ Wallet — เติมเงิน, ดูประวัติ
// ===================================

const Transaction = require('../models/transactionModel');
const User        = require('../models/userModel');

// ===================================
// GET /api/wallet/info
// ดึงยอดเงินปัจจุบันของ user
// ===================================
const getWalletInfo = async (req, res) => {
  try {
    const user = await User.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        balance : parseFloat(user.balance).toFixed(2),
        username: user.username
      }
    });
  } catch (error) {
    console.error('getWalletInfo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================================
// POST /api/wallet/topup
// User ส่งคำขอเติมเงินพร้อมสลิป
// ===================================
const requestTopup = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const note   = (req.body.note || '').trim();

    // ตรวจสอบจำนวนเงิน
    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'จำนวนเงินขั้นต่ำ 10 บาท'
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        success: false,
        message: 'จำนวนเงินสูงสุด 100,000 บาทต่อครั้ง'
      });
    }

    // ดึงชื่อไฟล์สลิปที่ multer บันทึกให้
    // req.file มาจาก middleware upload ใน routes
    const slipImage = req.file ? req.file.filename : null;

    if (!slipImage) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาแนบรูปสลิปการโอนเงิน'
      });
    }

    // บันทึกคำขอลงฐานข้อมูล
    const txId = await Transaction.createTopup(req.user.id, amount, slipImage, note);

    res.status(201).json({
      success: true,
      message: 'ส่งคำขอเติมเงินสำเร็จ กรุณารอ Admin ตรวจสอบ (ปกติภายใน 5-30 นาที)',
      data: { transactionId: txId, amount, status: 'pending' }
    });

  } catch (error) {
    console.error('requestTopup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================================
// GET /api/wallet/history
// ดูประวัติธุรกรรมของตัวเอง
// ===================================
const getHistory = async (req, res) => {
  try {
    const transactions = await Transaction.getByUserId(req.user.id);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('getHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================================
// GET /api/wallet/payment-info
// ดึงข้อมูลช่องทางชำระเงิน (จาก .env)
// ===================================
const getPaymentInfo = async (req, res) => {
  res.json({
    success: true,
    data: {
      promptpay     : process.env.PROMPTPAY_NUMBER,
      bankName      : process.env.BANK_NAME,
      bankAccount   : process.env.BANK_ACCOUNT_NUMBER,
      bankAccountName: process.env.BANK_ACCOUNT_NAME
    }
  });
};

module.exports = { getWalletInfo, requestTopup, getHistory, getPaymentInfo };
