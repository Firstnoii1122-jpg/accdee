# ACCDEE — Complete Project Skill Reference
# อัปเดต: 2026-05-17 — ใช้ไฟล์นี้ทำงานต่อได้ทันทีโดยไม่ต้องถามใหม่

---

## Stack & Runtime
- **Backend**: Node.js + Express 5 — `server.js` port 8080 (Railway) / 3000 (local)
- **Frontend**: Vanilla HTML/CSS/JS — `public/` (served as static)
- **Database**: MySQL via `mysql2/promise` — parameterized queries ทุกที่
- **Auth**: JWT (jsonwebtoken) — `localStorage('accdee_token')`
- **Email**: Gmail (nodemailer) primary + Resend fallback — `config/email.js`
- **Upload**: Cloudinary v2 — สลิปโอนเงิน
- **Notify**: Telegram Bot — admin แจ้งเตือน real-time
- **Deploy**: Railway — project `ingenious-enjoyment` (candy365) และ accdee project แยก account
- **Domain**: `https://www.accdee.shop` (DNS ผูกแล้ว) → Railway accdee service

---

## ⚠️ กฎเหล็ก — ห้ามลืม

| กฎ | เหตุผล |
|---|---|
| ห้าม commit `.env` | มี DB/JWT secret |
| Admin route ต้องมี `adminOnly` middleware | ป้องกัน privilege escalation |
| ใช้ parameterized query เสมอ | ป้องกัน SQL injection |
| bcrypt cost = 12 ทุกที่ | register, createAdmin, resetPassword, changePassword |
| อธิบายก่อน รอ confirm แล้วค่อยแก้ | user เรียนรู้ไปด้วย |
| ทำทีละไฟล์ | ป้องกัน cascade bug |

---

## โครงสร้างไฟล์ (สมบูรณ์)

```
accdee/
├── server.js               ← entry point, rate limiter, route mount
├── package.json            ← nodemailer, resend, cloudinary, bcryptjs, jsonwebtoken, mysql2, multer
├── .env                    ← secrets (ห้าม commit!)
├── .env.example
├── accdee-skill.md         ← ไฟล์นี้
├── CLAUDE.md               ← project instructions
│
├── config/
│   ├── db.js               ← MySQL pool (auto-detect MYSQLHOST || DB_HOST, DB_PASS || DB_PASSWORD)
│   ├── setupDb.js          ← CREATE TABLE IF NOT EXISTS ทุกตาราง + ALTER TABLE migrations
│   ├── email.js            ← sendEmail() — Gmail primary, Resend fallback
│   └── telegram.js         ← sendTelegram() admin notify, sendNotify() customer direct
│
├── middleware/
│   ├── authMiddleware.js   ← protect() — JWT verify → req.user = {id, role}
│   └── adminMiddleware.js  ← adminOnly() — requires req.user.role === 'admin'
│
├── models/
│   ├── userModel.js        ← findUserById, findUserByEmail, findUserByUsername, createUser
│   └── transactionModel.js ← createTopup, updateStatus
│
├── controllers/
│   ├── authController.js       ← register, login, verifyOtp, forgotPassword, resetPassword
│   ├── profileController.js    ← getProfile, updateUsername, changePassword
│   ├── walletController.js     ← getWalletInfo, requestTopup (Cloudinary), getHistory, useCoupon, getPaymentInfo
│   ├── shopController.js       ← getProducts, buyProduct, getOrders, addReview, getPublicReviews
│   ├── adminController.js      ← stats, topups, members, products, inventory, orders, coupons, settings, admins
│   └── telegramController.js   ← webhook handler
│
├── routes/
│   ├── authRoutes.js       ← /api/auth/*
│   ├── profileRoutes.js    ← /api/profile, /api/profile/username, /api/profile/change-password
│   ├── walletRoutes.js     ← /api/wallet/*
│   ├── shopRoutes.js       ← /api/shop/*
│   ├── adminRoutes.js      ← /api/admin/*
│   └── telegramRoutes.js   ← /api/telegram/*
│
└── public/
    ├── index.html          ← Landing page (auth modal, OTP, profile, reviews, shop preview)
    ├── shop.html           ← ร้านค้า
    ├── wallet.html         ← กระเป๋าเงิน
    ├── orders.html         ← ประวัติออเดอร์
    ├── profile.html        ← ข้อมูลส่วนตัว (เปลี่ยน username/password)
    ├── admin.html          ← Admin dashboard
    ├── admin-login.html    ← Admin login
    ├── reset-password.html ← Reset password page
    ├── images/             ← hero-main.jpg, hero-alt.png, banner-*.jpg (ดูด้านล่าง)
    ├── css/
    │   ├── style.css       ← Dark neon theme (CSS variables, responsive)
    │   └── admin-style.css ← Admin theme
    └── js/
        ├── main.js         ← Customer frontend (auth, shop, wallet, reviews, profile)
        └── admin-main.js   ← Admin dashboard logic
```

---

## Database Tables (ครบทุกตาราง)

| Table | Columns สำคัญ | Notes |
|---|---|---|
| `users` | id, username, email, password(bcrypt12), balance, role(user/admin), telegram_chat_id, two_fa_enabled, two_fa_otp, two_fa_expires | telegram_chat_id สำหรับ notify ลูกค้าโดยตรง |
| `transactions` | id, user_id, amount, type(topup/purchase), status(pending/approved/rejected), slip_image, note | slip_image = Cloudinary URL |
| `inventory` | id, product_key, credentials(TEXT), status(available/sold), order_id, added_at, sold_at | เพิ่มได้ทีละ bulk via admin |
| `orders` | id, user_id, product_key, product_name, amount, inventory_id, credentials, created_at | credentials = account info ที่ลูกค้าได้รับ |
| `products` | id, product_key(UNIQUE), name, description, price, is_active | product_key เป็น FK ใน inventory |
| `coupons` | id, code(UNIQUE), bonus_amount, max_uses, used_count, expires_at, is_active | |
| `coupon_uses` | coupon_id + user_id UNIQUE | ป้องกันใช้ซ้ำ |
| `reviews` | id, user_id, order_id(UNIQUE), rating(1-5), comment(500) | order_id UNIQUE = รีวิวได้ครั้งเดียวต่อออเดอร์ |
| `password_resets` | id, email, token(hex64), expires_at(+1h) | DELETE หลัง reset สำเร็จ |
| `site_settings` | setting_key(PK), setting_value, updated_at | alert_text, alert_active, line_url, telegram_url, promptpay, bank_name, bank_account, bank_holder |

### DB Migration Pattern
```js
// setupDb.js — safe idempotent columns
const optionalColumns = [ `ALTER TABLE users ADD COLUMN new_col ...` ];
for (const sql of optionalColumns) {
  try { await db.execute(sql); } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }
}
```

### Admin Account (สร้างอัตโนมัติครั้งแรก)
```
email:    admin@accdee.shop  ← HARDCODED (ไม่ใช่ ADMIN_EMAIL env)
password: ADMIN_PASSWORD env var
```
> ⚠️ ADMIN_EMAIL env ใช้สำหรับรับ notification เท่านั้น ไม่ใช่ login email

---

## Authentication Architecture

### Standard Login
```
POST /api/auth/login { email, password }
  → bcrypt.compare → ถ้า two_fa_enabled=0 → JWT { id, role, exp:7d } → { token, data }
  → ถ้า two_fa_enabled=1 → 2FA flow (ดูด้านล่าง)
Client: localStorage.setItem('accdee_token', token)
Header: Authorization: Bearer <token>
```

### 2FA OTP Flow
```
1. login → two_fa_enabled=1:
   - generate 6-digit OTP → UPDATE users SET two_fa_otp, two_fa_expires(+5min)
   - sendEmail OTP → return { requires2FA: true, tempToken }
   - tempToken = JWT { id, pending2FA: true, exp: 10min }  ← ไม่มี role!

2. POST /api/auth/verify-otp { tempToken, otp }
   - verify tempToken + check decoded.pending2FA === true
   - compare otp + check expiry
   - clear two_fa_otp/two_fa_expires → issue real JWT

3. Return { token, data } — same shape as normal login
```

### JWT Structure
```js
// Real session token
{ id: userId, role: 'user'|'admin', iat, exp }
// Temp 2FA token (protect middleware rejects — no role)
{ id: userId, pending2FA: true, iat, exp }
```

### Password Reset Flow
```
POST /api/auth/forgot-password { email }
  → DELETE old token → INSERT password_resets(email, token hex64, expires +1h)
  → sendEmail link: SITE_URL/reset-password.html?token=<hex64>
  → Always returns success (prevents email enumeration)

POST /api/auth/reset-password { token, password }
  → SELECT WHERE token=? AND expires_at > NOW()
  → bcrypt.hash(newPassword, 12) → UPDATE users → DELETE token
```

### Rate Limiting
```js
authLimiter: 15 req / 15 min  → /api/auth/*
apiLimiter:  100 req / 1 min  → all other /api/*
```

---

## API Endpoints (ครบทุก route)

### Public (ไม่ต้อง auth)
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/wallet/payment-info      → { promptpay, bank_name, bank_account, bank_holder }
GET  /api/wallet/site-settings     → { alert_text, alert_active, line_url, ... }
GET  /api/shop/reviews/public      → reviews rating≥4 (masked username)
GET  /api/health
```

### User (Bearer JWT)
```
GET  /api/profile
PUT  /api/profile/username         { username }
PUT  /api/profile/change-password  { currentPassword, newPassword }
GET  /api/wallet/info              → { balance, username }
POST /api/wallet/topup             multipart: amount, slip(file), note
GET  /api/wallet/history
POST /api/wallet/coupon            { code }
GET  /api/shop/products
POST /api/shop/buy                 { productKey }
GET  /api/shop/orders
POST /api/shop/orders/:id/review   { rating(1-5), comment }
```

### Admin (Bearer JWT + role=admin)
```
GET  /api/admin/stats              → { members, pendingTopups, ordersToday, totalRevenue, ... }
GET  /api/admin/members            ?search=
POST /api/admin/members/:id/credit { amount, type, note }
POST /api/admin/members/:id/reset-password { password }
POST /api/admin/members/:id/set-role { role: 'user'|'admin' }
POST /api/admin/members/:id/toggle-2fa
DELETE /api/admin/members/:id
GET  /api/admin/topups             → pending
GET  /api/admin/topups/history
POST /api/admin/topups/:id/approve
POST /api/admin/topups/:id/reject
GET  /api/admin/products
POST /api/admin/products           { productKey, name, description, price }
PUT  /api/admin/products/:key      { name, description, price, is_active }
DELETE /api/admin/products/:key
GET  /api/admin/inventory
GET  /api/admin/inventory/stock    → stock count per product
POST /api/admin/inventory          { productKey, credentials }         ← single
POST /api/admin/inventory/bulk     { productKey, credentialsList(newline) } ← bulk max 500
DELETE /api/admin/inventory/:id
GET  /api/admin/orders
GET  /api/admin/coupons
POST /api/admin/coupons            { code, bonus_amount, max_uses, expires_at? }
DELETE /api/admin/coupons/:id
GET  /api/admin/settings
PUT  /api/admin/settings           { alert_text?, alert_active?, line_url?, promptpay?, ... }
GET  /api/admin/admins
POST /api/admin/admins             { username, email, password }
```

---

## Railway Deployment

### สองโปรเจคที่แยกกัน
| โปรเจค | Account | Domain | สถานะ |
|---|---|---|---|
| `ingenious-enjoyment` / candy365 | pattamanarajad@gmail.com | candy365.online | Live ใช้งานอยู่ ห้ามแตะ |
| accdee (project ID: 95b47776-...) | iCloud account (Firstnoii_1122@icloud.com) | accdee.shop | ต้อง login Railway ใหม่ |

### วิธี deploy accdee
```powershell
! railway logout
! railway login   # login ด้วย iCloud/accdee account
railway link --project 95b47776-e7cd-41a4-82f6-667d506f43e7
railway up
```

### Railway Variables (accdee service)
```
PORT=8080
DB_HOST / DB_USER / DB_PASS / DB_NAME  ← Railway MySQL inject อัตโนมัติ
JWT_SECRET=393fecc...
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=panomphen865@gmail.com      ← รับ notification
ADMIN_PASSWORD=Accdee!Admin2026         ← password ของ admin@accdee.shop
FRONTEND_URL=https://www.accdee.shop
SITE_URL=https://www.accdee.shop        ← ใช้ใน reset password email link
PROMPTPAY_NUMBER=8292725105
BANK_NAME=ไทยพาณิชย์ (SCB)
BANK_ACCOUNT_NUMBER=8292725105
BANK_ACCOUNT_NAME=จตุภัทร พระสว่าง
CLOUDINARY_CLOUD_NAME=dhvkwljtz
CLOUDINARY_API_KEY=723958412578962
CLOUDINARY_API_SECRET=hT6pxVf7ccyjVZ-MQODZFqJn-0k
GMAIL_USER=panomphen865@gmail.com
GMAIL_APP_PASSWORD=nkwh zjlf qjdz gauq
EMAIL_FROM=Accdee <panomphen865@gmail.com>
RESEND_API_KEY=re_5LHK9qjJ_4v1kzPEX8EKJ2tjUNd7rcfEY
TELEGRAM_BOT_TOKEN=8442683460:AAGJ6FjeavSsAFqsHCfyzYvwdzSwcvy78pQ
TELEGRAM_CHAT_ID=7481841218
TELEGRAM_NOTIFY_BOT_TOKEN=8631114867:AAFqf9THRs4KL3qJbTP49nePuIXHw3GrNwk
```

### db.js — Variable Priority
```js
host    : MYSQLHOST     || DB_HOST
port    : MYSQLPORT     || DB_PORT    || 3306
user    : MYSQLUSER     || DB_USER
password: MYSQLPASSWORD || DB_PASSWORD || DB_PASS   ← Railway ใช้ DB_PASS
database: MYSQLDATABASE || DB_NAME
```

---

## Email System (config/email.js)
```js
// ลำดับ priority:
// 1. Resend — ถ้า RESEND_API_KEY set และไม่มี ${{ }} (Railway broken ref)
// 2. Gmail (nodemailer) — ถ้า GMAIL_USER + GMAIL_APP_PASSWORD set
// 3. Skip + console.warn
```

---

## Images (public/images/)

### Hero Carousel — ขนาดที่ถูกต้อง
| ไฟล์ | ขนาดแนะนำ | หมายเหตุ |
|---|---|---|
| `hero-main.jpg` | **1920 × 520 px** | Desktop height = 520px |
| `hero-alt.png` | **1920 × 520 px** | สไลด์ที่ 2 |

> ใส่เนื้อหาสำคัญไว้กลางภาพ — mobile จะ crop ขอบออก (object-fit: cover)
> CSS desktop: height 520px · mobile ≤768px: height 300px · ≤480px: height 220px

### Product Banners (320 × 180 px แนะนำ — 16:9)
`banner-facebook.jpg` · `banner-fb-ads.jpg` · `banner-fanpage.jpg`
`banner-bm-premium.jpg` · `banner-bm-personal.jpg` · `banner-bm-premium2.jpg`
`banner-twitter.jpg` · `banner-twitter-personal.jpg`
`banner-instagram.jpg` · `banner-ig-personal.jpg`
`banner-tiktok.jpg` · `banner-gmail.jpg` · `banner-netflix.jpg`
`banner-fb-personal.jpg`

---

## CSS Design Tokens (style.css)
```css
--bg-dark:     #050d1a
--bg-card:     #0a1628
--bg-card2:    #0f1e35
--neon-blue:   #00d4ff
--neon-green:  #00ff88
--neon-purple: #b400ff
--neon-pink:   #ff0080
--border:      rgba(0,212,255,0.18)
--nav-h:       64px
--radius:      12px
```

### Responsive Breakpoints
```css
@media (max-width: 768px)  /* tablet/mobile */
@media (max-width: 480px)  /* small phone — auth modal เป็น bottom-sheet */
```

---

## Common Patterns

### เพิ่ม Admin Page ใหม่
1. `admin.html`: เพิ่ม `<a class="menu-item" onclick="showPage('pageid', this)">` ใน sidebar
2. เพิ่ม `<div id="page-pageid" class="page">` ใน content area
3. `admin-main.js`: เพิ่ม `pageid: 'Page Title'` ใน `titleMap`
4. เพิ่ม `if (id === 'pageid') loadPageid();` ใน `showPage()`
5. เพิ่ม function `loadPageid()` + `window.loadPageid = loadPageid`

### เพิ่ม API Endpoint ใหม่
```js
// Controller
const newFunc = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT ... WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('newFunc error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
module.exports = { ..., newFunc };

// Route
router.get('/:id', protect, adminOnly, newFunc);
```

### site_settings upsert
```js
await db.execute(
  'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',
  [key, value]
);
```

### Admin API helper (frontend)
```js
API.get('/admin/...')
API.post('/admin/...', body)
API.put('/admin/...', body)
API.del('/admin/...')
```

---

## สถานะปัจจุบัน (2026-05-17)

### ✅ เสร็จ 100%
- Auth (register/login/2FA OTP/forgot/reset password)
- Profile (username/password change)
- Wallet (topup/coupon/history) + Cloudinary slip upload
- Shop (products/buy/orders/reviews)
- Admin Dashboard (stats/members/topups/products/inventory/coupons/settings/admins)
- Email system (Gmail + Resend dual)
- Telegram notifications
- Mobile responsive (bottom-sheet modal, carousel, product grid)
- SEO meta tags
- Security (rate limiting, helmet, bcrypt 12, parameterized queries)
- Railway variables set (candy365 service — รอ deploy accdee แยก)

### ❌ ยังต้องทำ
1. **Login Railway accdee account** → `railway logout` แล้ว `railway login`
2. **Deploy accdee code ขึ้น Railway** (project 95b47776-...)
3. **ตั้ง variables บน accdee service** (ค่าทั้งหมดอยู่ใน .env แล้ว)
4. **ทดสอบระบบ end-to-end** บน accdee.shop จริง

---

## วิธีรัน Local
```powershell
cd C:\Users\PCCOPA\Documents\MyProjects\accdee
npm install
node server.js
# เปิด http://localhost:8080
# Admin: email = admin@accdee.shop, password = ADMIN_PASSWORD จาก .env
```
