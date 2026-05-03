// ===================================
// server.js - จุดเริ่มต้นของ Server
// ===================================

// โหลด environment variables จากไฟล์ .env ก่อนเป็นอันดับแรก
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path'); // สำหรับ serve ไฟล์ frontend

// สร้าง Express application
const app = express();

// ===================================
// Middleware (ตัวกลางจัดการ request)
// ===================================

// อนุญาตให้ Frontend เรียก API ได้ข้าม domain
app.use(cors());

// แปลง request body จาก JSON string → JavaScript object อัตโนมัติ
app.use(express.json());

// Serve ไฟล์ Frontend จากโฟลเดอร์ public/
// เปิด http://localhost:3000 จะเห็นหน้าเว็บได้เลย
app.use(express.static(path.join(__dirname, 'public')));

// ===================================
// Routes (เส้นทาง API)
// ===================================

const authRoutes    = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const walletRoutes  = require('./routes/walletRoutes');

app.use('/api/auth',   authRoutes);
app.use('/api',        profileRoutes);
app.use('/api/wallet', walletRoutes);

// Serve รูปสลิปที่ user อัปโหลด
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route ทดสอบ API (ใช้ /api/health แทน / เพราะ / ถูก serve HTML แล้ว)
app.get('/api/health', (req, res) => {
  res.json({ message: 'Accdee API is running!', version: '1.0.0' });
});

// ===================================
// จัดการ Route ที่ไม่มีในระบบ (404)
// ===================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ===================================
// เริ่มต้น Server
// ===================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
