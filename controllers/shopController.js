const db               = require('../config/db');
const { sendTelegram } = require('../config/telegram');

// GET /api/shop/products — รายการสินค้าพร้อมจำนวนสต็อก
const getProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.product_key, p.name, p.description, p.price,
             COUNT(i.id) as stock
      FROM products p
      LEFT JOIN inventory i ON i.product_key = p.product_key AND i.status = 'available'
      WHERE p.is_active = 1
      GROUP BY p.product_key, p.name, p.description, p.price
      ORDER BY p.price ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/shop/buy — ซื้อสินค้า
const buyProduct = async (req, res) => {
  const { productKey } = req.body;
  const userId = req.user.id;

  if (!productKey) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุสินค้า' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ดึงข้อมูลสินค้าจาก DB
    const [[product]] = await conn.execute(
      'SELECT product_key, name, price FROM products WHERE product_key = ? AND is_active = 1',
      [productKey]
    );
    if (!product) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'ไม่พบสินค้านี้' });
    }

    // ล็อคแถว user ป้องกัน race condition (กด buy พร้อมกัน 2 ครั้ง)
    const [[user]] = await conn.execute(
      'SELECT id, username, balance FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    if (parseFloat(user.balance) < parseFloat(product.price)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `ยอดเงินไม่พอ (มี ${parseFloat(user.balance).toFixed(2)} ฿ ต้องการ ${product.price} ฿)`
      });
    }

    // หยิบสต็อกชิ้นแรกที่ว่าง
    const [[item]] = await conn.execute(
      "SELECT id, credentials FROM inventory WHERE product_key = ? AND status = 'available' LIMIT 1 FOR UPDATE",
      [productKey]
    );
    if (!item) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'สินค้าหมดสต็อก กรุณาติดต่อ Admin' });
    }

    const newBalance = parseFloat(user.balance) - parseFloat(product.price);

    // ตัดเงิน
    await conn.execute('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);

    // บันทึก order
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (user_id, product_key, product_name, amount, inventory_id, credentials) VALUES (?,?,?,?,?,?)',
      [userId, productKey, product.name, product.price, item.id, item.credentials]
    );
    const orderId = orderResult.insertId;

    // mark inventory ว่าขายแล้ว
    await conn.execute(
      "UPDATE inventory SET status = 'sold', order_id = ?, sold_at = NOW() WHERE id = ?",
      [orderId, item.id]
    );

    // บันทึก wallet history
    await conn.execute(
      "INSERT INTO transactions (user_id, amount, type, status, note) VALUES (?, ?, 'purchase', 'approved', ?)",
      [userId, product.price, `ซื้อ: ${product.name} #${orderId}`]
    );

    await conn.commit();

    sendTelegram(`🛒 <b>คำสั่งซื้อใหม่!</b>\n👤 ${user.username}\n📦 ${product.name}\n💵 ${parseFloat(product.price).toFixed(2)} ฿\n🆔 Order #${orderId}`);

    res.json({
      success: true,
      message: 'สั่งซื้อสำเร็จ!',
      data: {
        orderId,
        productName : product.name,
        amount      : parseFloat(product.price).toFixed(2),
        credentials : item.credentials,
        newBalance  : newBalance.toFixed(2)
      }
    });

  } catch (err) {
    await conn.rollback();
    console.error('buyProduct error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

// GET /api/shop/orders — ประวัติซื้อของลูกค้า
const getMyOrders = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, product_name, amount, credentials, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getProducts, buyProduct, getMyOrders };
