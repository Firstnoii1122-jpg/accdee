const db               = require('../config/db');
const bcrypt           = require('bcryptjs');
const Transaction      = require('../models/transactionModel');
const { sendEmail }              = require('../config/email');
const { sendTelegram, sendNotify } = require('../config/telegram');

const getPendingTopups = async (req, res) => {
  try {
    const rows = await Transaction.getPending();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPendingTopups error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const approveTopup = async (req, res) => {
  try {
    const tx = await Transaction.getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }
    await Transaction.approveTopup(tx.id, tx.user_id, tx.amount);

    const [[user]] = await db.execute('SELECT username, email, telegram_chat_id FROM users WHERE id = ?', [tx.user_id]);
    sendEmail({
      to     : user.email,
      subject: '✅ เติมเงินสำเร็จ!',
      html   : `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#16a34a">เติมเงินสำเร็จแล้ว ✅</h2>
          <p>สวัสดี ${user.username}</p>
          <p>ยอดเงิน <b>${parseFloat(tx.amount).toFixed(2)} บาท</b> ได้รับการอนุมัติแล้วครับ</p>
          <a href="https://www.accdee.shop" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">ดูยอดเงิน</a>
        </div>
      `
    });
    sendNotify(user.telegram_chat_id, `✅ <b>เติมเงินสำเร็จ!</b>\n💵 ${parseFloat(tx.amount).toFixed(2)} บาท เข้ากระเป๋าแล้วครับ\n<a href="https://www.accdee.shop/shop.html">ไปช้อปปิ้งเลย →</a>`);
    sendTelegram(`✅ <b>อนุมัติเติมเงินแล้ว</b>\n👤 ${user.username}\n💵 ${parseFloat(tx.amount).toFixed(2)} บาท`);

    res.json({ success: true, message: 'Approved and balance updated' });
  } catch (err) {
    if (err.code === 'TOPUP_ALREADY_PROCESSED') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }
    console.error('approveTopup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const rejectTopup = async (req, res) => {
  try {
    const tx = await Transaction.getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }
    await Transaction.rejectTopup(tx.id);

    const [[user]] = await db.execute('SELECT username, email, telegram_chat_id FROM users WHERE id = ?', [tx.user_id]);
    sendEmail({
      to     : user.email,
      subject: '❌ ไม่สามารถอนุมัติการเติมเงินได้',
      html   : `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#dc2626">ไม่สามารถอนุมัติการเติมเงินได้</h2>
          <p>สวัสดี ${user.username}</p>
          <p>คำขอเติมเงิน <b>${parseFloat(tx.amount).toFixed(2)} บาท</b> ไม่ผ่านการตรวจสอบครับ</p>
          <p>กรุณาติดต่อ Admin หากมีข้อสงสัย</p>
          <a href="https://www.accdee.shop" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px">กลับสู่เว็บไซต์</a>
        </div>
      `
    });
    sendNotify(user.telegram_chat_id, `❌ <b>คำขอเติมเงินไม่ผ่าน</b>\n💵 ${parseFloat(tx.amount).toFixed(2)} บาท\nกรุณาติดต่อ Admin หากมีข้อสงสัย`);

    res.json({ success: true, message: 'Rejected' });
  } catch (err) {
    if (err.code === 'TOPUP_ALREADY_PROCESSED') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }
    console.error('rejectTopup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/stats — สถิติสำหรับ dashboard
const getStats = async (req, res) => {
  try {
    const [[{ totalMembers }]] = await db.execute(
      "SELECT COUNT(*) as totalMembers FROM users WHERE role = 'user'"
    );
    const [[{ newToday }]] = await db.execute(
      "SELECT COUNT(*) as newToday FROM users WHERE role = 'user' AND DATE(created_at) = CURDATE()"
    );
    const [[{ pendingCount }]] = await db.execute(
      "SELECT COUNT(*) as pendingCount FROM transactions WHERE status = 'pending'"
    );
    const [[{ topupToday }]] = await db.execute(
      "SELECT COALESCE(SUM(amount),0) as topupToday FROM transactions WHERE type='topup' AND status='approved' AND DATE(created_at)=CURDATE()"
    );
    const [[{ ordersToday }]] = await db.execute(
      "SELECT COUNT(*) as ordersToday FROM orders WHERE DATE(created_at) = CURDATE()"
    );
    const [[{ totalRevenue }]] = await db.execute(
      "SELECT COALESCE(SUM(amount),0) as totalRevenue FROM transactions WHERE type='topup' AND status='approved'"
    );
    const [[{ totalOrders }]] = await db.execute(
      "SELECT COUNT(*) as totalOrders FROM orders"
    );
    const [recentTransactions] = await db.execute(
      `SELECT t.id, t.amount, t.type, t.status, t.created_at,
              u.username, u.email
       FROM transactions t JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC LIMIT 10`
    );
    res.json({
      success: true,
      data: { totalMembers, newToday, pendingCount, topupToday: parseFloat(topupToday),
              ordersToday, totalRevenue: parseFloat(totalRevenue), totalOrders,
              recentTransactions }
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/members — รายชื่อสมาชิกทั้งหมด
const getMembers = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = "SELECT id, username, email, balance, created_at FROM users WHERE role = 'user'";
    const params = [];
    if (search) {
      sql += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMembers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/members/:id/credit — ปรับยอดเงินสมาชิก
const adjustCredit = async (req, res) => {
  const { amount, type, note } = req.body;
  const userId = parseInt(req.params.id);

  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'จำนวนเงินไม่ถูกต้อง' });
  }
  if (parsedAmount > 1_000_000) {
    return res.status(400).json({ success: false, message: 'จำนวนเงินสูงสุด 1,000,000 บาทต่อครั้ง' });
  }
  if (!['deposit', 'withdraw'].includes(type)) {
    return res.status(400).json({ success: false, message: 'ประเภทไม่ถูกต้อง' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.execute('SELECT id, balance FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบสมาชิก' });
    }

    const delta = type === 'deposit' ? parseFloat(amount) : -parseFloat(amount);
    const newBalance = parseFloat(user.balance) + delta;
    if (newBalance < 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'ยอดเงินไม่เพียงพอ' });
    }

    await conn.execute('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);
    await conn.execute(
      "INSERT INTO transactions (user_id, amount, type, status, note) VALUES (?, ?, 'topup', 'approved', ?)",
      [userId, Math.abs(parseFloat(amount)), note || `Admin ${type}`]
    );
    await conn.commit();
    res.json({ success: true, message: `ปรับยอดเงินสำเร็จ ยอดใหม่: ${newBalance.toFixed(2)} ฿` });
  } catch (err) {
    await conn.rollback();
    console.error('adjustCredit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

// GET /api/admin/topups/history — ประวัติ topup ทั้งหมด
const getTopupHistory = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT t.id, t.amount, t.type, t.status, t.note, t.slip_image, t.created_at,
              u.username, u.email
       FROM transactions t JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getTopupHistory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/inventory — ดูสต็อกทั้งหมด
const getInventory = async (req, res) => {
  try {
    const { productKey } = req.query;
    let sql = 'SELECT id, product_key, credentials, status, added_at, sold_at FROM inventory';
    const params = [];
    if (productKey) {
      sql += ' WHERE product_key = ?';
      params.push(productKey);
    }
    sql += ' ORDER BY added_at DESC';
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getInventory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/inventory/stock — จำนวนสต็อกแต่ละสินค้า
const getStock = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT product_key, COUNT(*) as total, SUM(status='available') as available, SUM(status='sold') as sold FROM inventory GROUP BY product_key"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getStock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/inventory — เพิ่มสต็อก (ทีละชิ้น)
const addInventory = async (req, res) => {
  const { productKey, credentials } = req.body;
  if (!productKey || !credentials || !credentials.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO inventory (product_key, credentials) VALUES (?, ?)',
      [productKey, credentials.trim()]
    );
    res.status(201).json({ success: true, message: 'เพิ่มสต็อกสำเร็จ', data: { id: result.insertId } });
  } catch (err) {
    console.error('addInventory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/inventory/bulk — เพิ่มสต็อกทีละหลายชิ้น (แต่ละบรรทัด = 1 ชิ้น)
const bulkAddInventory = async (req, res) => {
  const { productKey, credentialsList } = req.body;
  if (!productKey || !credentialsList) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  const lines = String(credentialsList)
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลที่จะเพิ่ม' });
  }
  if (lines.length > 500) {
    return res.status(400).json({ success: false, message: 'เพิ่มได้สูงสุด 500 ชิ้นต่อครั้ง' });
  }

  try {
    const placeholders = lines.map(() => '(?, ?)').join(', ');
    const values       = lines.flatMap(cred => [productKey, cred]);
    await db.execute(`INSERT INTO inventory (product_key, credentials) VALUES ${placeholders}`, values);
    res.status(201).json({ success: true, message: `เพิ่มสต็อกสำเร็จ ${lines.length} ชิ้น`, count: lines.length });
  } catch (err) {
    console.error('bulkAddInventory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/inventory/:id — ลบสต็อก (เฉพาะที่ยังไม่ขาย)
const deleteInventory = async (req, res) => {
  try {
    const [[item]] = await db.execute('SELECT status FROM inventory WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
    if (item.status === 'sold') return res.status(400).json({ success: false, message: 'ลบไม่ได้ เพราะขายไปแล้ว' });
    await db.execute('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error('deleteInventory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/orders — ประวัติคำสั่งซื้อทั้งหมด
const getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT o.id, o.product_name, o.amount, o.created_at,
              u.username, u.email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/products — รายการสินค้าทั้งหมด
const getProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT p.*, COUNT(i.id) as stock FROM products p LEFT JOIN inventory i ON i.product_key = p.product_key AND i.status = "available" GROUP BY p.id ORDER BY p.price ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/products — เพิ่มสินค้าใหม่
const addProduct = async (req, res) => {
  const { productKey, name, description, price } = req.body;
  if (!productKey || !name || !price) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  if (isNaN(price) || parseFloat(price) <= 0) {
    return res.status(400).json({ success: false, message: 'ราคาไม่ถูกต้อง' });
  }
  try {
    await db.execute(
      'INSERT INTO products (product_key, name, description, price) VALUES (?, ?, ?, ?)',
      [productKey.trim().toLowerCase(), name.trim(), (description || '').trim(), parseFloat(price)]
    );
    res.status(201).json({ success: true, message: 'เพิ่มสินค้าสำเร็จ' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'product key นี้มีอยู่แล้ว' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/products/:key — ลบสินค้า
const deleteProduct = async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE product_key = ?', [req.params.key]);
    res.json({ success: true, message: 'ลบสินค้าสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/members/:id/reset-password — แอดมินรีเซ็ตรหัสผ่านให้ลูกค้า
const resetMemberPassword = async (req, res) => {
  try {
    const userId  = parseInt(req.params.id);
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const [[user]] = await db.execute('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบสมาชิก' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'ไม่สามารถรีเซ็ตรหัส admin ได้' });

    const hashed = await bcrypt.hash(password, 12);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.json({ success: true, message: `รีเซ็ตรหัสผ่านของ ${user.username} สำเร็จ` });
  } catch (err) {
    console.error('resetMemberPassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteMember = async (req, res) => {
  try {
    const [[user]] = await db.execute("SELECT id, role FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบสมาชิก' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'ลบ admin ไม่ได้' });
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'ลบสมาชิกสำเร็จ' });
  } catch (err) {
    console.error('deleteMember error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/coupons
const getCoupons = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

// POST /api/admin/coupons
const addCoupon = async (req, res) => {
  const { code, bonus_amount, max_uses, expires_at } = req.body;
  if (!code || !bonus_amount || parseFloat(bonus_amount) <= 0) {
    return res.status(400).json({ success: false, message: 'กรอกข้อมูลให้ครบ' });
  }
  try {
    await db.execute(
      'INSERT INTO coupons (code, bonus_amount, max_uses, expires_at) VALUES (?, ?, ?, ?)',
      [code.trim().toUpperCase(), parseFloat(bonus_amount), parseInt(max_uses) || 1, expires_at || null]
    );
    res.status(201).json({ success: true, message: 'สร้างโค้ดสำเร็จ' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'โค้ดนี้มีอยู่แล้ว' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/coupons/:id
const deleteCoupon = async (req, res) => {
  try {
    await db.execute('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'ลบโค้ดสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

// PUT /api/admin/products/:key — แก้ไขสินค้า
const editProduct = async (req, res) => {
  const { name, description, price, is_active } = req.body;
  const key = req.params.key;
  if (!name || !price || isNaN(price) || parseFloat(price) <= 0) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  try {
    const [result] = await db.execute(
      'UPDATE products SET name=?, description=?, price=?, is_active=? WHERE product_key=?',
      [name.trim(), (description||'').trim(), parseFloat(price), is_active == null ? 1 : (is_active ? 1 : 0), key]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
    res.json({ success: true, message: 'แก้ไขสินค้าสำเร็จ' });
  } catch (err) {
    console.error('editProduct error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/settings — ดึงตั้งค่าทั้งหมด
const getSettings = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT setting_key, setting_value FROM site_settings');
    const data = {};
    rows.forEach(r => { data[r.setting_key] = r.setting_value; });
    res.json({ success: true, data });
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/settings — บันทึกตั้งค่า
const updateSettings = async (req, res) => {
  const allowed = ['alert_text','alert_active','line_url','telegram_url','facebook_url','promptpay','bank_name','bank_account','bank_holder'];
  try {
    const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!entries.length) return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลที่จะบันทึก' });
    for (const [k, v] of entries) {
      await db.execute(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=?',
        [k, String(v), String(v)]
      );
    }
    res.json({ success: true, message: 'บันทึกการตั้งค่าสำเร็จ' });
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/admins — รายชื่อ admin ทั้งหมด
const getAdmins = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, username, email, created_at FROM users WHERE role = 'admin' ORDER BY created_at ASC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAdmins error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/admins — สร้าง admin ใหม่
const createAdmin = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
  }
  try {
    const [[existing]] = await db.execute('SELECT id FROM users WHERE email = ? OR username = ?', [email.toLowerCase(), username]);
    if (existing) return res.status(409).json({ success: false, message: 'อีเมลหรือชื่อผู้ใช้นี้มีอยู่แล้ว' });

    const hashed = await bcrypt.hash(password, 12);
    await db.execute(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')",
      [username.trim(), email.trim().toLowerCase(), hashed]
    );
    res.status(201).json({ success: true, message: `สร้าง admin "${username}" สำเร็จ` });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'อีเมลหรือชื่อผู้ใช้นี้มีอยู่แล้ว' });
    console.error('createAdmin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/members/:id/set-role — promote/demote user ↔ admin
const setMemberRole = async (req, res) => {
  const targetId  = parseInt(req.params.id);
  const selfId    = req.user.id;
  const { role }  = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'role ต้องเป็น user หรือ admin เท่านั้น' });
  }
  if (targetId === selfId) {
    return res.status(400).json({ success: false, message: 'ไม่สามารถเปลี่ยน role ของตัวเองได้' });
  }
  try {
    const [[target]] = await db.execute('SELECT id, username FROM users WHERE id = ?', [targetId]);
    if (!target) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });

    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, targetId]);
    const action = role === 'admin' ? 'เลื่อนเป็น Admin' : 'ลดเป็น User';
    res.json({ success: true, message: `${action} "${target.username}" สำเร็จ` });
  } catch (err) {
    console.error('setMemberRole error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/members/:id/toggle-2fa — enable/disable 2FA for a user
const toggle2FA = async (req, res) => {
  const targetId = parseInt(req.params.id);
  try {
    const [[user]] = await db.execute('SELECT id, username, two_fa_enabled FROM users WHERE id = ?', [targetId]);
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });

    const newState = user.two_fa_enabled ? 0 : 1;
    await db.execute('UPDATE users SET two_fa_enabled = ? WHERE id = ?', [newState, targetId]);

    const stateText = newState ? 'เปิด' : 'ปิด';
    res.json({ success: true, message: `${stateText} 2FA สำหรับ "${user.username}" สำเร็จ`, two_fa_enabled: newState });
  } catch (err) {
    console.error('toggle2FA error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPendingTopups, approveTopup, rejectTopup, getStats, getMembers, adjustCredit, resetMemberPassword, deleteMember, getTopupHistory, getInventory, getStock, addInventory, bulkAddInventory, deleteInventory, getAllOrders, getProducts, addProduct, deleteProduct, editProduct, getCoupons, addCoupon, deleteCoupon, getSettings, updateSettings, getAdmins, createAdmin, setMemberRole, toggle2FA };
