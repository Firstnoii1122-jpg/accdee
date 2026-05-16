# CLAUDE.md — ACCDEE Social Media Account Store

## โปรเจคคืออะไร
ร้านขายบัญชีโซเชียลมีเดียพรีเมียมออนไลน์ **ACCDEE**
- Backend: Node.js + Express → `server.js` port 3000
- Frontend: Vanilla HTML/CSS/JS → `public/`
- Database: MySQL (mysql2/promise)
- Auth: JWT
- อัปโหลดสลิป: Cloudinary
- Email: Resend API
- แจ้งเตือน: Telegram Bot

---

## กฎเหล็ก — ห้ามลืม

| กฎ | เหตุผล |
|----|--------|
| ห้าม commit `.env` | มี DB password + JWT secret |
| Admin route ต้องผ่าน `adminMiddleware.js` | ป้องกัน privilege escalation |
| ใช้ parameterized query เสมอ | ป้องกัน SQL injection |
| อธิบายก่อน รอ confirm แล้วค่อยแก้ | user เรียนรู้ไปด้วย |
| ทำทีละไฟล์ | ป้องกันพัง cascade |

---

## โครงสร้างไฟล์

```
accdee/
├── CLAUDE.md               ← ไฟล์นี้
├── accdee-skill.md         ← skill reference
├── server.js               ← entry point PORT 3000
├── package.json
├── database.sql            ← schema สำหรับ setup
├── .env                    ← secrets (ห้าม commit!)
├── .env.example            ← template
├── .gitignore
│
├── config/
│   ├── db.js               ← MySQL pool
│   ├── setupDb.js          ← auto-create tables on start
│   ├── email.js            ← Resend email wrapper
│   └── telegram.js         ← Telegram Bot notify
│
├── middleware/
│   ├── authMiddleware.js   ← JWT verify
│   └── adminMiddleware.js  ← role=admin check
│
├── models/
│   ├── userModel.js        ← user CRUD helpers
│   └── transactionModel.js ← transaction CRUD
│
├── controllers/
│   ├── authController.js   ← register/login/forgot/reset
│   ├── profileController.js
│   ├── walletController.js ← wallet/topup/coupon
│   ├── shopController.js   ← products/buy/orders/reviews
│   ├── adminController.js  ← admin dashboard
│   └── telegramController.js
│
├── routes/
│   ├── authRoutes.js       ← /api/auth/*
│   ├── profileRoutes.js    ← /api/profile
│   ├── walletRoutes.js     ← /api/wallet/*
│   ├── shopRoutes.js       ← /api/shop/*
│   ├── adminRoutes.js      ← /api/admin/*
│   └── telegramRoutes.js   ← /api/telegram/*
│
└── public/
    ├── index.html          ← Landing page
    ├── shop.html           ← ร้านค้า
    ├── wallet.html         ← กระเป๋าเงิน
    ├── orders.html         ← ประวัติออเดอร์
    ├── admin.html          ← Admin dashboard
    ├── admin-login.html    ← Admin login
    ├── images/             ← รูปทั้งหมด (hero + product banners)
    ├── css/
    │   ├── style.css       ← หน้าลูกค้า (dark neon theme)
    │   └── admin-style.css ← หน้าแอดมิน
    └── js/
        ├── main.js         ← frontend logic ทั้งหมด
        └── admin-main.js   ← admin dashboard logic
```

---

## Database Tables

| Table | คำอธิบาย |
|---|---|
| `users` | id, username, email, password(hash), balance, role, telegram_chat_id |
| `transactions` | id, user_id, amount, type, status, slip_image, note |
| `inventory` | id, product_key, credentials(JSON), status(available/sold) |
| `orders` | id, user_id, product_key, product_name, amount, credentials |
| `products` | id, product_key, name, description, price, is_active |
| `coupons` | id, code, bonus_amount, max_uses, used_count, expires_at |
| `reviews` | id, user_id, order_id, rating, comment |

---

## API Endpoints

### Public
```
POST /api/auth/register        สมัครสมาชิก
POST /api/auth/login           login → JWT
POST /api/auth/forgot-password ขอ reset link
POST /api/auth/reset-password  reset ด้วย token
GET  /api/wallet/payment-info  ข้อมูลช่องทางชำระ (public)
```

### User (Bearer token)
```
GET  /api/profile              ข้อมูล user
GET  /api/wallet/info          balance
POST /api/wallet/topup         แจ้งเติมเงิน + แนบสลิป
GET  /api/wallet/history       ประวัติ transaction
POST /api/wallet/coupon        ใช้ coupon
GET  /api/shop/products        list สินค้า
POST /api/shop/buy             ซื้อสินค้า
GET  /api/shop/orders          ประวัติออเดอร์
POST /api/shop/orders/:id/review รีวิว
```

### Admin (Bearer token + role=admin)
```
GET  /api/admin/stats          dashboard stats
GET  /api/admin/topups         pending topups
POST /api/admin/topups/:id/approve  อนุมัติ
POST /api/admin/topups/:id/reject   ปฏิเสธ
GET  /api/admin/members        list สมาชิก
POST /api/admin/members/:id/credit  ปรับเครดิต
POST /api/admin/members/:id/reset-password
DELETE /api/admin/members/:id
GET  /api/admin/products       list สินค้า
POST /api/admin/products       เพิ่มสินค้า
DELETE /api/admin/products/:key
GET  /api/admin/inventory      ดู inventory
POST /api/admin/inventory      เพิ่ม stock
DELETE /api/admin/inventory/:id
GET  /api/admin/orders         ทุกออเดอร์
GET  /api/admin/coupons        list coupon
POST /api/admin/coupons        สร้าง coupon
DELETE /api/admin/coupons/:id
```

---

## รูปภาพ (public/images/)

| ไฟล์ | ใช้ที่ไหน |
|---|---|
| `hero-main.jpg` | Banner carousel slide 1 |
| `hero-alt.png` | Banner carousel slide 2 |
| `banner-facebook.jpg` | Product card: Facebook |
| `banner-fb-ads.jpg` | Product card: Facebook Ads/BM |
| `banner-fanpage.jpg` | Product card: Fanpage |
| `banner-bm-premium.jpg` | Product card: Business Manager Premium |
| `banner-bm-personal.jpg` | Product card: BM Personal เก่า |
| `banner-twitter.jpg` | Product card: Twitter Premium |
| `banner-twitter-personal.jpg` | Product card: Twitter Personal |
| `banner-instagram.jpg` | Product card: Instagram Premium |
| `banner-ig-personal.jpg` | Product card: Instagram Personal |
| `banner-tiktok.jpg` | Product card: TikTok |
| `banner-gmail.jpg` | Product card: Gmail |
| `banner-netflix.jpg` | Product card: Netflix |
| `banner-fb-personal.jpg` | Product card: Facebook Personal |
| `banner-bm-premium2.jpg` | สำรอง BM |

---

## ENV Variables

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=accdee_site
JWT_SECRET=          ← ต้องยาว 32+ ตัวอักษร
JWT_EXPIRES_IN=7d
ADMIN_PASSWORD=      ← initial admin password
ADMIN_EMAIL=admin@accdee.shop
PROMPTPAY_NUMBER=
BANK_NAME=
BANK_ACCOUNT_NUMBER=
BANK_ACCOUNT_NAME=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=       ← optional
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_NOTIFY_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

---

## วิธีรัน

```powershell
cd C:\Users\PCCOPA\Documents\MyProjects\accdee
npm install
node server.js
# เปิด http://localhost:3000
```

---

## สถานะปัจจุบัน (2026-05-16)

### ✅ เสร็จแล้ว
- Auth system ครบ
- Wallet + topup + coupon
- Shop + buy + orders + reviews
- Admin dashboard ครบ
- Telegram + Email notify
- Hero banner carousel (รูปจริง)
- Product cards มีรูปแต่ละสินค้า
- Rate limiting security
- .env ออกจาก git แล้ว

### ❌ ยังต้องทำ
- ตั้งค่า Cloudinary (upload สลิป)
- ตั้งค่า Telegram Bot
- Deploy Railway/VPS
- Domain จริง
