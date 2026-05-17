require('dotenv').config();

const args = new Set(process.argv.slice(2));
const strictProduction = args.has('--production');
const runtimeProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.RAILWAY_ENVIRONMENT === 'production' ||
  process.env.RAILWAY_PROJECT_ID ||
  process.env.FORCE_PRODUCTION_SECURITY === 'true';

const productionMode = strictProduction || runtimeProduction;

const results = [];

function valueOf(names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim() !== '') {
      return { name, value: value.trim() };
    }
  }
  return { name: names[0], value: '' };
}

function record(level, name, message) {
  results.push({ level, name, message });
}

function ok(name, message) {
  record('OK', name, message);
}

function warn(name, message) {
  record('WARN', name, message);
}

function fail(name, message) {
  record('FAIL', name, message);
}

function isPlaceholder(value) {
  return /\[SET_|your_|change|changeme|example|placeholder|123456|password|secret/i.test(value);
}

function requireAny(names, options = {}) {
  const { label = names.join(' or '), minLength = 1, productionRequired = true } = options;
  const found = valueOf(names);
  const required = productionMode ? productionRequired : options.localRequired === true;

  if (!found.value) {
    if (required) fail(label, 'missing required variable');
    else warn(label, 'not set for local/optional use');
    return '';
  }

  if (found.value.length < minLength) {
    fail(label, `too short; minimum length is ${minLength}`);
    return found.value;
  }

  if (isPlaceholder(found.value)) {
    fail(label, 'looks like a placeholder/default value');
    return found.value;
  }

  ok(label, `set via ${found.name}`);
  return found.value;
}

function requireUrl(name, options = {}) {
  const value = process.env[name] || '';
  const required = productionMode ? options.productionRequired !== false : options.localRequired === true;

  if (!value.trim()) {
    if (required) fail(name, 'missing required URL');
    else warn(name, 'not set for local use');
    return;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(name, 'must be a valid URL');
    return;
  }

  if (productionMode && parsed.protocol !== 'https:') {
    fail(name, 'must use https in production');
    return;
  }

  ok(name, 'valid URL');
}

function checkCore() {
  if (productionMode) {
    if (process.env.NODE_ENV === 'production') ok('NODE_ENV', 'production mode enabled');
    else warn('NODE_ENV', 'production security signal detected, but NODE_ENV is not production');
  } else {
    warn('NODE_ENV', 'local/development mode');
  }

  requireAny(['JWT_SECRET'], { minLength: 32, productionRequired: true, localRequired: false });

  const jwtExpires = process.env.JWT_EXPIRES_IN || '';
  if (!jwtExpires) {
    warn('JWT_EXPIRES_IN', 'not set; app fallback will be used');
  } else if (!/^\d+(m|h|d)$/i.test(jwtExpires)) {
    warn('JWT_EXPIRES_IN', 'unusual format; expected examples: 15m, 30m, 1h, 7d');
  } else if (/^\d+d$/i.test(jwtExpires)) {
    warn('JWT_EXPIRES_IN', 'days-long sessions increase token theft risk');
  } else {
    ok('JWT_EXPIRES_IN', 'set with short-session style');
  }

  requireUrl('SITE_URL', { productionRequired: true });
  requireUrl('FRONTEND_URL', { productionRequired: true });
}

function checkDatabase() {
  requireAny(['MYSQLHOST', 'DB_HOST'], { label: 'database host', productionRequired: true, localRequired: false });
  requireAny(['MYSQLPORT', 'DB_PORT'], { label: 'database port', productionRequired: false, localRequired: false });
  requireAny(['MYSQLUSER', 'DB_USER'], { label: 'database user', productionRequired: true, localRequired: false });
  requireAny(['MYSQLPASSWORD', 'DB_PASSWORD', 'DB_PASS'], { label: 'database password', minLength: 1, productionRequired: true, localRequired: false });
  requireAny(['MYSQLDATABASE', 'DB_NAME'], { label: 'database name', productionRequired: true, localRequired: false });
}

function checkAdminAndUploads() {
  requireAny(['ADMIN_PASSWORD'], { minLength: 12, productionRequired: true, localRequired: false });
  requireAny(['ADMIN_EMAIL'], { productionRequired: true, localRequired: false });
  requireAny(['CLOUDINARY_CLOUD_NAME'], { productionRequired: true, localRequired: false });
  requireAny(['CLOUDINARY_API_KEY'], { minLength: 5, productionRequired: true, localRequired: false });
  requireAny(['CLOUDINARY_API_SECRET'], { minLength: 12, productionRequired: true, localRequired: false });
}

function checkPaymentAndNotifications() {
  requireAny(['PROMPTPAY_NUMBER'], { label: 'payment promptpay', productionRequired: true, localRequired: false });
  requireAny(['BANK_NAME'], { label: 'payment bank name', productionRequired: true, localRequired: false });
  requireAny(['BANK_ACCOUNT_NUMBER'], { label: 'payment bank account number', productionRequired: true, localRequired: false });
  requireAny(['BANK_ACCOUNT_NAME'], { label: 'payment bank account name', productionRequired: true, localRequired: false });

  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasGmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  if (hasResend || hasGmail) ok('email provider', hasResend ? 'Resend configured' : 'Gmail configured');
  else warn('email provider', 'missing; password reset/admin email may not send');

  const hasTelegram = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  if (hasTelegram) ok('telegram admin alerts', 'configured');
  else warn('telegram admin alerts', 'missing; admin alerts may not send');

  if (process.env.TELEGRAM_WEBHOOK_SECRET) ok('TELEGRAM_WEBHOOK_SECRET', 'configured');
  else warn('TELEGRAM_WEBHOOK_SECRET', 'missing; webhook endpoint should reject requests');

  if (process.env.UPTIME_WEBHOOK_SECRET) ok('UPTIME_WEBHOOK_SECRET', 'configured');
  else warn('UPTIME_WEBHOOK_SECRET', 'not set; /api/telegram/uptime-alert will reject UptimeRobot pings');
}

checkCore();
checkDatabase();
checkAdminAndUploads();
checkPaymentAndNotifications();

for (const result of results) {
  console.log(`${result.level} ${result.name}: ${result.message}`);
}

const failures = results.filter((result) => result.level === 'FAIL');
const warnings = results.filter((result) => result.level === 'WARN');

console.log(`Environment check summary: ${results.length - failures.length - warnings.length} OK, ${warnings.length} warning(s), ${failures.length} failure(s)`);
console.log('Secret values were not printed.');

if (failures.length > 0) {
  process.exit(1);
}
