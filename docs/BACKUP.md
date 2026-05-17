# BACKUP — คู่มือสำรองข้อมูล ACCDEE

> ⚠️ ทำ backup สม่ำเสมอ — ถ้า database หายก็หาย ไม่มีทางกู้คืน

---

## 1. สิ่งที่ต้อง Backup

| ข้อมูล | ความสำคัญ | ความถี่ |
|---|---|---|
| **Database (MySQL)** | 🔴 สูงสุด | ทุกวัน |
| **Railway Variables** | 🔴 สูง | ทุกครั้งที่เปลี่ยน |
| **GitHub repo** | 🟠 สูง | อัตโนมัติ (git push) |
| **Cloudflare DNS** | 🟡 กลาง | ทุกครั้งที่เปลี่ยน |
| **.env (local)** | 🟡 กลาง | ทุกครั้งที่เปลี่ยน |

---

## 2. Backup Database — วิธีทำ

### วิธีที่ 0: npm script ในโปรเจกต์
```powershell
cd C:\Users\PCCOPA\Documents\MyProjects\accdee
npm run backup:db
```

ผลลัพธ์จะอยู่ในโฟลเดอร์ `backups/` ซึ่งถูก ignore ไม่ให้ติด Git แล้ว

หมายเหตุ:
- ต้องมี `mysqldump` อยู่ในเครื่องหรือ environment ที่รัน
- script อ่านค่า DB จาก `.env` หรือ Railway variables
- script ไม่พิมพ์ password ออกหน้าจอ
- ห้าม commit ไฟล์ `.sql` หรือ `backups/`

### วิธีที่ 1: Railway CLI (แนะนำ)
```powershell
# 1. ติดตั้ง Railway CLI (ถ้ายังไม่มี)
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link project
railway link

# 4. Backup ด้วย mysqldump ผ่าน Railway
railway run mysqldump -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE > backup_$(date +%Y%m%d).sql
```

### วิธีที่ 2: Railway Dashboard (ง่ายกว่า)
1. เปิด Railway → Project → service **MySQL**
2. คลิก **Connect** → copy connection string
3. ใช้ MySQL Workbench หรือ DBeaver เชื่อมต่อ
4. Export → SQL dump
5. บันทึกไฟล์ชื่อ `backup_YYYY-MM-DD.sql`

### วิธีที่ 3: Script อัตโนมัติ (Windows)
สร้างไฟล์ `scripts/backup.bat`:
```batch
@echo off
SET DATE=%date:~10,4%-%date:~4,2%-%date:~7,2%
SET BACKUP_DIR=C:\backups\accdee
mkdir %BACKUP_DIR% 2>nul
railway run mysqldump ... > %BACKUP_DIR%\backup_%DATE%.sql
echo Backup complete: backup_%DATE%.sql
```

---

## 3. ตารางเวลา Backup

### Daily (ทุกวัน — ทำเองหรือ schedule)
- [ ] Export database → บันทึกชื่อ `backup_YYYY-MM-DD.sql`
- [ ] เก็บใน Google Drive / iCloud / USB
- [ ] เก็บไว้ 30 วันล่าสุด

### Weekly (ทุกสัปดาห์)
- [ ] Backup database เต็ม + zip
- [ ] Screenshot Railway Variables ทั้งหมด
- [ ] เก็บใน Cloud storage แยก folder

### Monthly
- [ ] ทดสอบ restore database บนเครื่องตัวเอง
- [ ] ตรวจสอบว่า backup ไฟล์เปิดได้ปกติ

---

## 4. Backup Railway Variables

**อย่าเก็บ variables จริงใน repo!**

วิธีเก็บปลอดภัย:
1. Railway Dashboard → Variables → **Export** (ถ้ามีปุ่ม)
2. หรือ Screenshot เก็บใน password manager (1Password, Bitwarden)
3. หรือ เก็บใน encrypted note (Apple Notes with password)

ตัวแปรที่ต้อง backup:
```
JWT_SECRET
ADMIN_PASSWORD
CLOUDINARY_API_SECRET
RESEND_API_KEY / GMAIL_APP_PASSWORD
TELEGRAM_BOT_TOKEN
DB_PASS (MySQL password)
```

---

## 5. Backup .env (Local)

```powershell
# Copy .env ไปเก็บในที่ปลอดภัย (ไม่ใช่ใน repo!)
Copy-Item .env "C:\Users\PCCOPA\Documents\Backup\accdee_env_backup.txt"
```

⚠️ ห้าม push `.env` ขึ้น GitHub เด็ดขาด — ตรวจสอบ `.gitignore`:
```
.env
*.env
```

---

## 6. Backup Cloudflare DNS

1. Cloudflare Dashboard → เลือก domain `accdee.shop`
2. DNS → **Export** (ปุ่มด้านขวา)
3. บันทึกไฟล์ `accdee_dns_backup.txt`
4. เก็บไว้ใน Google Drive

---

## 7. GitHub Repo — Backup อัตโนมัติ

Git push ทุกครั้ง = backup code อัตโนมัติ
ตรวจสอบว่า push สม่ำเสมอ:
```powershell
cd C:\Users\PCCOPA\Documents\MyProjects\accdee
git log --oneline -5  # ดู commit ล่าสุด
```

เพิ่ม GitHub backup:
- Settings → Branches → ป้องกัน branch `main`
- ห้าม force push โดยไม่ตรวจสอบ

---

## 8. ที่เก็บ Backup แนะนำ

| ที่เก็บ | ฟรี | ใช้งาน |
|---|---|---|
| Google Drive | 15GB | เก็บ SQL dump |
| iCloud | 5GB | เก็บ .env backup |
| USB Flash drive | — | เก็บ monthly |
| GitHub (private repo) | ✅ | เก็บ code (ไม่ใช่ secret!) |
