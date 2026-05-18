require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const setupDb    = require('./config/setupDb');
const { assertJwtConfig } = require('./utils/jwtConfig');
const { getRuntimeEnvironment, isProductionRuntime } = require('./utils/runtimeEnv');
const packageInfo = require('./package.json');

const app = express();

// Railway terminates TLS/proxy before Express, so rate-limit needs the real client IP.
app.set('trust proxy', 1);

assertJwtConfig();

const productionOrigins = [
  process.env.FRONTEND_URL,
  process.env.SITE_URL,
  'https://www.accdee.shop',
  'https://accdee.shop',
].filter(Boolean);

const developmentOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const allowedOrigins = isProductionRuntime()
  ? productionOrigins
  : [...productionOrigins, ...developmentOrigins];

// Request logging
app.use(morgan('[:date[iso]] :method :url :status :res[content-length]B :response-time ms'));

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc : ["'self'"],
      scriptSrc  : ["'self'", "'unsafe-inline'"],   // inline onclick handlers ใน HTML
      scriptSrcAttr: ["'unsafe-inline'"],            // legacy storefront still uses onclick attributes
      styleSrc   : ["'self'", "'unsafe-inline'",
                    'https://fonts.googleapis.com'],
      fontSrc    : ["'self'", 'https://fonts.gstatic.com'],
      imgSrc     : ["'self'", 'data:', 'https://res.cloudinary.com',
                    'https://www.accdee.shop'],
      connectSrc : ["'self'"],
      baseUri    : ["'self'"],
      formAction : ["'self'"],
      frameAncestors: ["'none'"],
      frameSrc   : ["'none'"],
      objectSrc  : ["'none'"],
      upgradeInsecureRequests: isProductionRuntime() ? [] : null,
    }
  }
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin blocked'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

function adminPageHeaders(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
}

app.get('/admin-login.html', adminPageHeaders, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin.html', adminPageHeaders, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

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
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    status: 'ok',
    service: 'accdee',
    version: packageInfo.version,
    environment: getRuntimeEnvironment(),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

function startDbMonitor() {
  const db = require('./config/db');
  const { sendTelegram } = require('./config/telegram');
  let lastDown = false;
  setInterval(async () => {
    try {
      await db.execute('SELECT 1');
      if (lastDown) {
        lastDown = false;
        sendTelegram('✅ <b>ACCDEE กลับมาออนไลน์แล้ว</b>\nDB connection กลับมาปกติ');
      }
    } catch {
      if (!lastDown) {
        lastDown = true;
        sendTelegram('🚨 <b>ACCDEE — DB Connection Error</b>\nเชื่อมต่อฐานข้อมูลไม่ได้ กรุณาตรวจสอบด่วน!');
      }
    }
  }, 5 * 60 * 1000);
}

function start() {
  return setupDb()
    .then(() => {
      const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
      startDbMonitor();
      return server;
    })
    .catch(err => {
      console.error('Database setup failed:', err.message);
      process.exit(1);
    });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
