# RESTORE — คู่มือกู้คืนระบบ ACCDEE

> เมื่อเว็บพัง ทำตามขั้นตอนนี้ตามลำดับ — ห้ามรีบ ห้ามทำพร้อมกัน

---

## สถานการณ์ที่ 1: เว็บช้า / ไม่โหลด (ปัญหาทั่วไป)

### Step 1 — ตรวจก่อนว่าพังจริงไหม
```
1. เปิด https://www.accdee.shop/api/health
   → ถ้าเห็น {"ok":true} = API ทำงานอยู่ (ปัญหาที่ frontend)
   → ถ้า timeout หรือ error = server ล่ม

2. เปิด UptimeRobot → สีแดง = ล่มจริง
```

### Step 2 — ดู Railway Logs
```
Railway → Project → service → Deployments → View Logs
หา error message → Google หาวิธีแก้
```

### Step 3 — Restart Service
```
Railway → service → Settings → Restart
รอ 2-3 นาที แล้วลองเปิดเว็บใหม่
```

---

## สถานการณ์ที่ 2: Deploy ใหม่แล้วเว็บพัง (Rollback)

### วิธี Rollback ทันที (2 นาที)
```powershell
# 1. ดู commit ล่าสุดที่ทำงานได้
git log --oneline -10

# 2. Revert กลับไป commit ก่อนหน้า
git revert HEAD --no-edit

# 3. Push ขึ้น → Railway deploy อัตโนมัติ
git push origin main
```

### หรือผ่าน Railway Dashboard
```
Railway → Deployments → คลิก deployment ก่อนหน้า → Redeploy
```

---

## สถานการณ์ที่ 3: Database พัง / ข้อมูลหาย

### ตรวจก่อน
```powershell
# Railway CLI
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE -e "SHOW TABLES;"
```

### กู้จาก Backup
```powershell
# 1. เชื่อม MySQL
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE

# 2. Import backup
railway run mysql -h ... < backup_2026-05-17.sql
```

### ถ้าไม่มี backup
- ข้อมูลที่หายไม่สามารถกู้ได้
- **นี่คือเหตุผลที่ต้อง backup ทุกวัน**
- Server จะสร้างตารางใหม่ผ่าน `setupDb.js` เมื่อ restart แต่ข้อมูลจะหาย

---

## สถานการณ์ที่ 4: .env / Variables หาย

### Railway Variables หาย
ค่าที่ต้องใส่ใหม่ (ดูจาก backup password manager):
```
JWT_SECRET         = [ดูจาก backup]
ADMIN_PASSWORD     = [ดูจาก backup]
CLOUDINARY_*       = [ดูจาก Cloudinary Dashboard]
RESEND_API_KEY     = [ดูจาก Resend Dashboard]
GMAIL_APP_PASSWORD = [ดูจาก Google App Passwords]
TELEGRAM_BOT_TOKEN = [ดูจาก @BotFather]
DB_PASS            = [ดูจาก Railway MySQL service]
```

### ขั้นตอน
```
1. Railway → service → Variables → เพิ่มทีละตัว
2. Railway → Redeploy
3. ทดสอบ: เปิด /api/health → {"ok":true}
4. ทดสอบ: login admin → admin@accdee.shop
```

---

## สถานการณ์ที่ 5: Domain / DNS พัง

### ตรวจ
```
1. เปิด https://www.candy365.online/api/health → ถ้าใช้ได้ = DNS ปัญหา
2. ping www.accdee.shop → ดู IP
3. nslookup www.accdee.shop → ดู DNS records
```

### แก้
```
1. Cloudflare → DNS → ตรวจ A record หรือ CNAME ของ accdee.shop
2. ต้องชี้ไปที่ Railway domain
3. รอ DNS propagate 5-30 นาที
```

---

## Checklist กู้ระบบ Step-by-Step

```
□ ขั้น 1: ยืนยันว่าพังจริง (เปิด /api/health)
□ ขั้น 2: ดู Railway logs หา error
□ ขั้น 3: ลอง restart service ก่อน (เร็วสุด)
□ ขั้น 4: ถ้ายังพัง → rollback deploy ก่อนหน้า
□ ขั้น 5: ตรวจ environment variables ครบไหม
□ ขั้น 6: ตรวจ database เชื่อมต่อได้ไหม
□ ขั้น 7: ถ้ายังพัง → import backup database
□ ขั้น 8: ทดสอบทุก feature หลัง restore
□ ขั้น 9: แจ้งลูกค้าถ้า downtime เกิน 30 นาที
```

---

## เวลาที่ใช้กู้ระบบ (ประมาณ)

| สถานการณ์ | เวลา |
|---|---|
| Restart service | 2-5 นาที |
| Rollback deploy | 5-10 นาที |
| กู้ database จาก backup | 15-30 นาที |
| ตั้งค่า Variables ใหม่ | 10-20 นาที |
| แก้ DNS | 30 นาที - 2 ชั่วโมง |
