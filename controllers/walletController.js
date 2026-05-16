const cloudinary       = require('cloudinary').v2;
const Transaction      = require('../models/transactionModel');
const User             = require('../models/userModel');
const { sendTelegram } = require('../config/telegram');
const db               = require('../config/db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key   : process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const getWalletInfo = async (req, res) => {
  try {
    const user = await User.findUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { balance: parseFloat(user.balance).toFixed(2), username: user.username } });
  } catch (error) {
    console.error('getWalletInfo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const requestTopup = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const note   = (req.body.note || '').trim().slice(0, 500);

    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: 'จำนวนเงินขั้นต่ำ 10 บาท' });
    }
    if (amount > 100000) {
      return res.status(400).json({ success: false, message: 'จำนวนเงินสูงสุด 100,000 บาทต่อครั้ง' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'กรุณาแนบรูปสลิปการโอนเงิน' });
    }

    // อัปโหลดไป Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'accdee/slips', resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    const slipImage = uploadResult.secure_url;
    const txId = await Transaction.createTopup(req.user.id, amount, slipImage, note);

    const user = await User.findUserById(req.user.id);
    sendTelegram(`💰 <b>มีคำขอเติมเงินใหม่!</b>\n👤 ${user.username}\n💵 ${amount} บาท\n📋 รหัส: #${txId}\n\n⚡ เข้าตรวจสอบที่ https://www.accdee.shop/admin.html`);

    res.status(201).json({
      success: true,
      message: 'ส่งคำขอเติมเงินสำเร็จ กรุณารอ Admin ตรวจสอบ (ปกติภายใน 5-30 นาที)',
      data   : { transactionId: txId, amount, status: 'pending' }
    });

  } catch (error) {
    console.error('requestTopup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getHistory = async (req, res) => {
  try {
    const transactions = await Transaction.getByUserId(req.user.id);
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('getHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPaymentInfo = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?, ?, ?, ?)',
      ['promptpay', 'bank_name', 'bank_account', 'bank_holder']);
    const s = {};
    rows.forEach(r => { s[r.setting_key] = r.setting_value; });
    res.json({
      success: true,
      data: {
        promptpay      : s.promptpay       || process.env.PROMPTPAY_NUMBER       || '',
        bankName       : s.bank_name       || process.env.BANK_NAME              || '',
        bankAccount    : s.bank_account    || process.env.BANK_ACCOUNT_NUMBER    || '',
        bankAccountName: s.bank_holder     || process.env.BANK_ACCOUNT_NAME      || ''
      }
    });
  } catch (error) {
    console.error('getPaymentInfo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSiteSettings = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT setting_key, setting_value FROM site_settings');
    const data = {};
    rows.forEach(r => { data[r.setting_key] = r.setting_value; });
    res.json({ success: true, data });
  } catch (error) {
    console.error('getSiteSettings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/wallet/coupon — ใช้โค้ดส่วนลด
const useCoupon = async (req, res) => {
  const code   = (req.body.code || '').trim().toUpperCase();
  const userId = req.user.id;

  if (!code) return res.status(400).json({ success: false, message: 'กรุณากรอกโค้ด' });

  const conn = await require('../config/db').getConnection();
  try {
    await conn.beginTransaction();

    const [[coupon]] = await conn.execute(
      'SELECT * FROM coupons WHERE code = ? AND is_active = 1',
      [code]
    );
    if (!coupon) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'โค้ดไม่ถูกต้องหรือหมดอายุแล้ว' });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'โค้ดหมดอายุแล้ว' });
    }
    if (coupon.used_count >= coupon.max_uses) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'โค้ดถูกใช้ครบแล้ว' });
    }

    // เช็คว่าเคยใช้โค้ดนี้แล้วหรือยัง
    const [[alreadyUsed]] = await conn.execute(
      'SELECT id FROM coupon_uses WHERE coupon_id = ? AND user_id = ?',
      [coupon.id, userId]
    );
    if (alreadyUsed) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'คุณเคยใช้โค้ดนี้แล้ว' });
    }

    // เพิ่มเงินเข้ากระเป๋า
    await conn.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [coupon.bonus_amount, userId]);
    await conn.execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
    await conn.execute('INSERT INTO coupon_uses (coupon_id, user_id) VALUES (?, ?)', [coupon.id, userId]);
    await conn.execute(
      "INSERT INTO transactions (user_id, amount, type, status, note) VALUES (?, ?, 'topup', 'approved', ?)",
      [userId, coupon.bonus_amount, `โค้ดส่วนลด: ${code}`]
    );

    await conn.commit();
    res.json({ success: true, message: `ใช้โค้ดสำเร็จ! ได้รับเงิน ${coupon.bonus_amount} บาท`, data: { bonus: coupon.bonus_amount } });
  } catch (err) {
    await conn.rollback();
    console.error('useCoupon error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

module.exports = { getWalletInfo, requestTopup, getHistory, getPaymentInfo, getSiteSettings, useCoupon };
