const db      = require('./db');
const bcrypt  = require('bcryptjs');

async function setupDatabase() {
  // สร้างตาราง users ถ้ายังไม่มี
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         INT           NOT NULL AUTO_INCREMENT,
      username   VARCHAR(50)   NOT NULL UNIQUE,
      email      VARCHAR(100)  NOT NULL UNIQUE,
      password   VARCHAR(255)  NOT NULL,
      balance    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      role       ENUM('user','admin') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_email    (email),
      INDEX idx_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // สร้างตาราง transactions ถ้ายังไม่มี
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id         INT            NOT NULL AUTO_INCREMENT,
      user_id    INT            NOT NULL,
      amount     DECIMAL(10,2)  NOT NULL,
      type       ENUM('topup','purchase') NOT NULL DEFAULT 'topup',
      status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      slip_image VARCHAR(255)   NULL,
      note       VARCHAR(500)   NULL,
      created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // สร้างตาราง inventory (สต็อกบัญชีที่รอขาย)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS inventory (
      id          INT           NOT NULL AUTO_INCREMENT,
      product_key VARCHAR(50)   NOT NULL,
      credentials TEXT          NOT NULL,
      status      ENUM('available','sold') NOT NULL DEFAULT 'available',
      order_id    INT           NULL,
      added_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sold_at     TIMESTAMP     NULL,
      PRIMARY KEY (id),
      INDEX idx_product_status (product_key, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // สร้างตาราง orders (ประวัติคำสั่งซื้อ)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id           INT           NOT NULL AUTO_INCREMENT,
      user_id      INT           NOT NULL,
      product_key  VARCHAR(50)   NOT NULL,
      product_name VARCHAR(255)  NOT NULL,
      amount       DECIMAL(10,2) NOT NULL,
      inventory_id INT           NULL,
      credentials  TEXT          NULL,
      created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // สร้างตาราง products (รายชื่อสินค้าพร้อมราคา Admin จัดการได้)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id          INT           NOT NULL AUTO_INCREMENT,
      product_key VARCHAR(50)   NOT NULL UNIQUE,
      name        VARCHAR(255)  NOT NULL,
      description TEXT          NULL,
      price       DECIMAL(10,2) NOT NULL,
      is_active   TINYINT(1)    NOT NULL DEFAULT 1,
      created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_product_key (product_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // สร้างตาราง password_resets (เก็บ token สำหรับรีเซ็ตรหัสผ่าน)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id         INT           NOT NULL AUTO_INCREMENT,
      email      VARCHAR(100)  NOT NULL,
      token      VARCHAR(255)  NOT NULL,
      expires_at DATETIME      NOT NULL,
      created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_token (token),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // เพิ่มคอลัมน์ telegram_chat_id ถ้ายังไม่มี (ถ้ามีแล้วจะ ignore error)
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(50) NULL DEFAULT NULL`);
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }

  // สร้าง Admin คนแรก ถ้ายังไม่มี (ทำแค่ครั้งเดียว ไม่ reset ทุก restart)
  const [adminRows] = await db.execute(
    'SELECT id FROM users WHERE email = ?',
    ['admin@accdee.shop']
  );
  if (adminRows.length === 0) {
    const rawPassword    = process.env.ADMIN_PASSWORD || 'ChangeMe@2026!';
    const hashedPassword = await bcrypt.hash(rawPassword, 12);
    await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@accdee.shop', hashedPassword, 'admin']
    );
    console.log('Admin account created');
  }

  // เพิ่มสินค้า default ถ้ายังไม่มี (ทำแค่ครั้งเดียว)
  const defaultProducts = [
    { key: 'fb-blank',  name: 'บัญชี Facebook เปล่า',              desc: 'บัญชี Facebook ใหม่ ไม่มีแฟนเพจ พร้อมใช้งานทันที เหมาะสำหรับเริ่มต้น',          price: 50  },
    { key: 'fb-5page',  name: 'บัญชี Facebook พร้อม 5 แฟนเพจ',    desc: 'บัญชีที่มีแฟนเพจ 5 เพจ ราคาสุดคุ้ม เหมาะสำหรับผู้เริ่มยิงโฆษณา',               price: 50  },
    { key: 'fb-10page', name: 'บัญชี Facebook พร้อม 10 แฟนเพจ',   desc: 'บัญชีที่มีแฟนเพจครบ 10 เพจ เหมาะสำหรับงานโฆษณา Facebook Ads',                  price: 100 },
  ];

  for (const p of defaultProducts) {
    const [rows] = await db.execute('SELECT id FROM products WHERE product_key = ?', [p.key]);
    if (rows.length === 0) {
      await db.execute(
        'INSERT INTO products (product_key, name, description, price) VALUES (?, ?, ?, ?)',
        [p.key, p.name, p.desc, p.price]
      );
    }
  }

  console.log('Database ready');
}

module.exports = setupDatabase;
