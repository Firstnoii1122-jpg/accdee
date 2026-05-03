-- ================================================
-- database.sql — สร้างฐานข้อมูล ACCDEE
-- รันไฟล์นี้ครั้งเดียวตอน setup server ใหม่
-- ================================================

-- สร้าง database (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS accdee_site
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE accdee_site;

-- ================================================
-- ตาราง users — เก็บข้อมูลสมาชิก
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id         INT           NOT NULL AUTO_INCREMENT,
  username   VARCHAR(50)   NOT NULL,
  email      VARCHAR(100)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  balance    DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- ยอดเงินใน wallet
  role       ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- ตาราง transactions — เก็บประวัติเติมเงิน
-- ================================================
CREATE TABLE IF NOT EXISTS transactions (
  id         INT            NOT NULL AUTO_INCREMENT,
  user_id    INT            NOT NULL,
  amount     DECIMAL(10,2)  NOT NULL,
  type       ENUM('topup','purchase') NOT NULL DEFAULT 'topup',
  status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  slip_image VARCHAR(255)   NULL,       -- ชื่อไฟล์สลิปที่อัปโหลด
  note       VARCHAR(500)   NULL,       -- หมายเหตุจาก user
  created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- สร้าง Admin คนแรก (เปลี่ยน password ด้วยนะ!)
-- password ที่ hash ไว้นี้คือ: admin1234
-- ================================================
INSERT IGNORE INTO users (username, email, password, role)
VALUES (
  'admin',
  'admin@accdee.shop',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- รหัส: admin1234
  'admin'
);
