# MONITORING — คู่มือดูแลเว็บ ACCDEE

## 1. ดู Log บน Railway

### วิธีเข้า
1. เปิด [railway.com](https://railway.com)
2. เข้า Project → service **candy365** (หรือ accdee)
3. คลิกแถบ **Deployments** → เลือก deploy ล่าสุด
4. คลิก **View Logs**

### Log ที่เห็นทุกครั้งคือ (Morgan)
```
[2026-05-17T06:14:00.000Z] POST /api/auth/login 200 142B 45 ms
[2026-05-17T06:14:01.000Z] GET /api/shop/products 200 2048B 12 ms
[2026-05-17T06:14:02.000Z] POST /api/wallet/topup 201 88B 320 ms
```
ความหมาย: `[เวลา] METHOD /path สถานะ ขนาด เวลา`

---

## 2. HTTP Status Code — อ่านออกทำอะไร

| Code | ความหมาย | ต้องทำอะไร |
|---|---|---|
| **200** | สำเร็จปกติ | ไม่ต้องทำอะไร |
| **201** | สร้างข้อมูลสำเร็จ | ปกติ |
| **400** | ข้อมูลที่ส่งมาผิดรูปแบบ | ปกติ (user ส่งผิด) |
| **401** | ไม่ได้ login / token หมดอายุ | ปกติ |
| **403** | login แล้วแต่ไม่มีสิทธิ์ | ปกติ (user พยายามเข้า admin) |
| **404** | หา URL ไม่เจอ | ปกติ |
| **429** | ส่ง request เยอะเกิน (rate limit) | ปกติ — อาจมีคนโจมตี |
| **500** | Server error ❌ | **ต้องตรวจสอบทันที** |
| **502/503** | Server ล่ม | **ด่วน — เช็ก Railway** |

---

## 3. Log ที่ต้องสังเกต

### 🔴 ต้องตรวจสอบทันที
```
# เยอะผิดปกติ → อาจโดนโจมตี brute-force
POST /api/auth/login 401 ... (เกิน 20 ครั้งใน 5 นาที)

# Server error
GET /api/anything 500 ...

# ไม่มีคนเข้าเลย (เว็บล่ม)
(ไม่มี log เกิน 5 นาที)
```

### 🟡 สังเกตไว้
```
# rate limit กำลังทำงาน
... 429 ...  (มีคนส่ง request เยอะ)

# admin route ถูกเรียก
POST /api/admin/topups/123/approve 200
DELETE /api/admin/members/5 200
```

---

## 4. ตั้ง UptimeRobot (ฟรี) — แจ้งเตือนเว็บล่มทาง Line/Email

1. สมัคร [uptimerobot.com](https://uptimerobot.com) (ฟรี)
2. Add New Monitor:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `ACCDEE Production`
   - URL: `https://www.accdee.shop/api/health`
   - Monitoring Interval: **5 minutes**
3. Alert Contacts → เพิ่ม Email หรือ Telegram
4. เมื่อเว็บล่มจะได้รับแจ้งเตือนภายใน 5 นาที

### Health Endpoint ของเรา
```
GET https://www.accdee.shop/api/health
→ {"ok":true,"status":"ok","service":"accdee","version":"1.0.0","environment":"production","uptimeSeconds":123,"timestamp":"2026-05-17T00:00:00.000Z"}
```
UptimeRobot จะ check ทุก 5 นาที ถ้าไม่ได้ 200 → แจ้งเตือน

ถ้า response แสดง `"environment":"development"` บนเว็บจริง ให้ตรวจ Railway Variables และตั้ง `NODE_ENV=production` ทันที เพราะ production security mode ควรทำงานบนเว็บจริงเท่านั้น

---

## 5. ดู Login ล้มเหลว

ใน Railway logs กรอง (Ctrl+F):
```
/api/auth/login 401
```
ถ้าเห็น IP เดิมส่งซ้ำๆ เกิน 15 ครั้ง → rate limiter บล็อกแล้วอัตโนมัติ (15 req/15 นาที)

---

## 6. ดู Admin Actions

ใน Railway logs กรอง:
```
/api/admin/
```
ดูว่า admin ทำอะไรบ้าง เวลาไหน — ถ้าเห็น DELETE หรือ approve เยอะผิดปกติให้ตรวจสอบ

---

## 7. Railway Auto-Restart

ระบบตั้งค่าใน `railway.toml` แล้ว:
```toml
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```
ถ้า server crash → Railway restart อัตโนมัติ 10 ครั้ง
ถ้า restart ครบ 10 ครั้งแล้วยังพัง → ดู log หาสาเหตุ

---

## 8. Checklist ตรวจรายวัน (5 นาที)

- [ ] เปิด `https://www.accdee.shop` → โหลดได้ปกติ
- [ ] เปิด UptimeRobot → status สีเขียว
- [ ] Railway logs → ไม่มี 500 error
- [ ] Telegram → ไม่มีแจ้งเตือน error
