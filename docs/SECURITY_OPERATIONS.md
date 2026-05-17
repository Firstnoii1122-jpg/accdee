# SECURITY OPERATIONS — คู่มือดูแลความปลอดภัย ACCDEE

---

## ตรวจรายวัน (5 นาที)

### 1. เช็ก UptimeRobot
- เปิด [uptimerobot.com](https://uptimerobot.com)
- ทุก monitor ต้อง **สีเขียว**
- ถ้าสีแดง → เว็บล่ม → ดู RESTORE.md

### 2. เช็ก Railway Logs
ใน Railway Logs หา pattern เหล่านี้:
```
# ❌ ต้องสนใจ
500    → Server error
/api/auth/login 401 (เยอะๆ) → brute-force
DELETE /api/admin → ใครลบอะไร

# ✅ ปกติ
200, 201, 400, 401, 403, 404
```

### 3. เช็ก Telegram แจ้งเตือน
ดูว่ามีการแจ้งเตือนที่ผิดปกติไหม:
- เติมเงินเยอะผิดปกติ
- มีสมาชิกใหม่เยอะผิดปกติ

---

## ตรวจรายสัปดาห์ (15 นาที)

### 1. รีวิว Admin Actions
ดู Railway logs ของสัปดาห์ที่ผ่านมา กรอง:
```
/api/admin/topups
/api/admin/members
/api/admin/inventory
admin.topup_approved
admin.topup_rejected
admin.credit_adjusted
```
ตรวจว่า action เหล่านี้สมเหตุสมผลไหม

### 2. ตรวจสมาชิกผิดปกติ
```
Admin Dashboard → Members
→ ดูสมาชิกใหม่ที่เพิ่มมาในสัปดาห์นี้
→ มี username แปลกๆ ไหม (bot pattern เช่น user123456789)
→ มีคนพยายาม login หลายครั้งไหม
```

### 3. ตรวจ Pending Topups
```
Admin Dashboard → Topups
→ ตรวจสลิปทุกใบ
→ อย่า approve สลิปที่ดูปลอม/แก้ไข
```

---

## เหตุการณ์ที่น่าสงสัย — ทำอะไรทันที

### 🔴 Login fail เยอะผิดปกติ
```
ใน logs: POST /api/auth/login 401 (เกิน 50 ครั้งใน 1 ชั่วโมง)
```
**ทำ:**
1. Rate limiter จะบล็อกอัตโนมัติ (15 req/15 min)
2. ดู IP ที่โจมตี → Cloudflare → block IP
3. ถ้ามี admin account → เปลี่ยน password ทันที

### 🔴 มีคน access /api/admin/* โดยไม่ได้ login
```
ใน logs: GET /api/admin/stats 401 (จาก IP แปลก)
```
**ทำ:**
1. ตรวจสอบ token ยัง valid ไหม
2. ถ้า admin token รั่วไหล → เปลี่ยน JWT_SECRET ทันที (ทุก session จะ expire)
3. เปลี่ยน admin password

### 🔴 ยอดเงินลูกค้าลดลงโดยไม่มีเหตุผล
**ทำ:**
1. Railway logs → หา `/api/admin/members/:id/credit` ว่าใครสั่ง
2. ตรวจ transaction history ใน admin dashboard
3. ถ้าผิดปกติ → เปลี่ยน admin password ทันที

### 🟠 มี 500 error เยอะ
```
ใน logs: ... 500 ... (เกิน 5 ครั้งใน 10 นาที)
```
**ทำ:**
1. ดู error message ใน logs
2. ถ้า "MySQL connection failed" → database ล่ม → Railway MySQL status
3. ถ้า "Cannot read properties" → code bug → rollback

### 🟠 มีสมาชิก fake จำนวนมาก
```
Admin → Members → เห็น username pattern: abc12345, xyz98765
```
**ทำ:**
1. ลบสมาชิกที่ผิดปกติผ่าน Admin Dashboard
2. เพิ่ม rate limit การสมัครสมาชิก (แจ้งให้แก้โค้ด)

---

## การเปลี่ยน JWT_SECRET (emergency)

⚠️ ทำเมื่อ: สงสัยว่า admin token รั่วไหล หรือถูกขโมย

```
ผล: ทุก user ต้อง login ใหม่ทั้งหมด
```

ขั้นตอน:
```
1. สร้าง random string ใหม่ (64+ ตัวอักษร)
   → https://generate-random.org/api-key-generator

2. Railway → Variables → JWT_SECRET = [ค่าใหม่]

3. Redeploy

4. แจ้งลูกค้าว่าต้อง login ใหม่
```

---

## การเปลี่ยน Admin Password

```
Admin Dashboard → Members → หา admin → Reset Password
```
หรือผ่าน `ADMIN_PASSWORD` ใน Railway Variables แต่ต้อง delete admin user แล้วให้ setupDb สร้างใหม่

---

## Security Checklist รายเดือน

- [ ] เปลี่ยน admin password
- [ ] ตรวจสอบ Railway Variables ยังครบไหม
- [ ] ตรวจ Cloudinary — มีไฟล์แปลกขึ้นมาไหม
- [ ] ตรวจ Resend — มี email ส่งผิดปกติไหม
- [ ] ตรวจ Telegram Bot ยังทำงานไหม
- [ ] ทดสอบ forgot password ส่ง email ได้ไหม
- [ ] ทดสอบ topup + Cloudinary upload ได้ไหม
- [ ] Backup database ล่าสุดมีหรือเปล่า
