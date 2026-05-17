require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const setupDb    = require('./config/setupDb');

const app = express();

// Request logging
app.use(morgan('[:date[iso]] :method :url :status :res[content-length]B :response-time ms'));

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc : ["'self'"],
      scriptSrc  : ["'self'", "'unsafe-inline'"],   // inline onclick handlers ใน HTML
      styleSrc   : ["'self'", "'unsafe-inline'",
                    'https://fonts.googleapis.com'],
      fontSrc    : ["'self'", 'https://fonts.gstatic.com'],
      imgSrc     : ["'self'", 'data:', 'https://res.cloudinary.com',
                    'https://www.accdee.shop'],
      connectSrc : ["'self'"],
      frameSrc   : ["'none'"],
      objectSrc  : ["'none'"],
    }
  }
}));

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting — ป้องกัน brute-force login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 15,
  message: { success: false, message: 'ลองอีกครั้งใน 15 นาที' },
  standardHeaders: true, legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 นาที
  max: 100,
  message: { success: false, message: 'Request มากเกินไป' },
  standardHeaders: true, legacyHeaders: false,
});

const authRoutes     = require('./routes/authRoutes');
const profileRoutes  = require('./routes/profileRoutes');
const walletRoutes   = require('./routes/walletRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const shopRoutes     = require('./routes/shopRoutes');
const telegramRoutes = require('./routes/telegramRoutes');

app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api',          apiLimiter, profileRoutes);
app.use('/api/wallet',   apiLimiter, walletRoutes);
app.use('/api/admin',    apiLimiter, adminRoutes);
app.use('/api/shop',     apiLimiter, shopRoutes);
app.use('/api/telegram', apiLimiter, telegramRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ป้องกัน admin.html ถูกเข้าถึงโดยตรงโดยไม่มี token ใน header
// (defense-in-depth: JS ฝั่ง frontend ก็ redirect อยู่แล้ว)
app.get('/admin.html', (req, res, next) => {
  const auth = req.headers['authorization'] || req.query._t;
  if (!auth) {
    return res.redirect('/admin-login.html');
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

setupDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  });
