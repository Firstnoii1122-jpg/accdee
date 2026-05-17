# PRODUCTION CHECKLIST — ก่อนเปิดร้านจริง ACCDEE

ทำ checklist นี้ให้ครบก่อนบอกลูกค้าว่าเว็บพร้อมใช้งาน

---

## ✅ Section 1: Domain & HTTPS

- [ ] `https://www.accdee.shop` เปิดได้ (ไม่ขึ้น warning)
- [ ] HTTP → redirect ไป HTTPS อัตโนมัติ
- [ ] SSL certificate ไม่หมดอายุ (ดูที่ lock icon บน browser)
- [ ] Cloudflare DNS ชี้ถูกต้อง (A record หรือ CNAME → Railway)
- [ ] www.accdee.shop และ accdee.shop เปิดได้ทั้งคู่

---

## ✅ Section 2: Railway Variables

ตรวจว่าตั้งค่าครบ:
- [ ] `JWT_SECRET` (32+ ตัวอักษร ไม่ใช่ค่า default)
- [ ] `ADMIN_PASSWORD` (แข็งแรง ไม่ใช่ default)
- [ ] `DB_HOST` / `DB_PASS` / `DB_NAME` (Railway MySQL)
- [ ] `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET`
- [ ] `GMAIL_USER` / `GMAIL_APP_PASSWORD` หรือ `RESEND_API_KEY`
- [ ] `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`
- [ ] `FRONTEND_URL` = `https://www.accdee.shop`
- [ ] `SITE_URL` = `https://www.accdee.shop`
- [ ] `PROMPTPAY_NUMBER` / `BANK_NAME` / `BANK_ACCOUNT_NUMBER`

---

## ✅ Section 3: ความปลอดภัย

- [ ] `.env` ไม่อยู่ใน git (`git status` ไม่เห็น `.env`)
- [ ] GitHub repo เป็น private หรือถ้า public ต้องยืนยันว่าไม่มี secret ใน history
- [ ] ตรวจ `public/` แล้วไม่มี JWT secret, admin password, DB password, email key, Telegram token, หรือ Cloudinary API secret
- [ ] `JWT_SECRET` ไม่ใช่ค่า default ("accdee_super_secret...")
- [ ] Admin password ไม่ใช่ default
- [ ] Secret ที่เคยอยู่ในเอกสารหรือ git history ถูก rotate แล้ว
- [ ] Rate limiting ทำงาน (ลอง login ผิด 15 ครั้ง → ต้องได้ error)
- [ ] Admin panel redirect ถ้าไม่ login (`/admin.html` → `/admin-login.html`)
- [ ] HTTPS enforced (ไม่มี HTTP leak)
- [ ] CSP header มี (ดูใน browser DevTools → Network → Headers)

---

## ✅ Section 4: Features ทุกอย่างทำงาน

### Authentication
- [ ] สมัครสมาชิกใหม่ได้ → ได้รับ email ยืนยัน
- [ ] Login ได้ → เห็นชื่อและยอดเงิน
- [ ] Forgot password → ได้รับ email link
- [ ] Reset password → เปลี่ยนได้จริง
- [ ] Logout → token หาย

### Shop
- [ ] เห็นสินค้าทุกตัว (ไม่ต้อง login ก็ดูได้)
- [ ] ซื้อสินค้า → หักเงิน → ได้รับ credentials
- [ ] ดูประวัติออเดอร์ได้
- [ ] รีวิวสินค้าได้

### Wallet
- [ ] เติมเงิน + upload สลิป → Cloudinary อัปโหลดได้
- [ ] Admin approve → ยอดเงินเพิ่ม
- [ ] ใช้ coupon → ยอดเงินเพิ่ม
- [ ] ดูประวัติธุรกรรมได้

### Admin
- [ ] Login admin ด้วย `admin@accdee.shop`
- [ ] Dashboard แสดงสถิติ
- [ ] Approve/reject topup ได้
- [ ] เพิ่ม/ลบสินค้าได้
- [ ] เพิ่ม inventory ได้ (single + bulk)
- [ ] สร้าง coupon ได้
- [ ] Telegram แจ้งเตือนเมื่อมี topup ใหม่

### Profile
- [ ] เปลี่ยน username ได้
- [ ] เปลี่ยน password ได้

---

## ✅ Section 5: Performance & Monitoring

- [ ] หน้าแรกโหลดเร็ว (< 3 วินาที)
- [ ] Mobile ใช้งานได้ปกติ (ทดสอบบนมือถือจริง)
- [ ] UptimeRobot ตั้งค่าและ monitor แล้ว
- [ ] Railway auto-restart ทำงาน (`railway.toml` มี policy)

---

## ✅ Section 6: Backup

- [ ] Database backup ล่าสุดเก็บไว้แล้ว
- [ ] ทดสอบ `npm run backup:db` หรือยืนยันว่ามี backup SQL ล่าสุดจาก Railway/DBeaver
- [ ] ทดสอบ `npm run restore:check -- <backup.sql>` กับไฟล์ backup ล่าสุด
- [ ] Railway Variables backup เก็บไว้ใน password manager
- [ ] `.env` backup เก็บไว้นอก repo
- [ ] GitHub repo เป็น private (ไม่ให้คนอื่นเห็น code)

---

## ✅ Section 7: Payment & Contact

- [ ] PromptPay QR code แสดงถูกต้อง
- [ ] ข้อมูลบัญชีธนาคารถูกต้อง
- [ ] LINE link ใช้งานได้
- [ ] Telegram link ใช้งานได้
- [ ] Admin email รับ notification ได้จริง

---

## สรุป: พร้อม Deploy จริงเมื่อ

```
□ Checklist ครบทุกข้อ (หรือมีเหตุผลที่ skip ได้)
□ ทดสอบบน mobile จริงแล้ว
□ มี backup database แล้ว
□ UptimeRobot ติดตั้งแล้ว
□ แจ้งลูกค้าทาง LINE/Telegram
```

**วันที่ตรวจ:** ________________  
**ผลการตรวจ:** ________________  
**ผู้ตรวจ:** ________________
