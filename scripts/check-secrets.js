const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const scanTargets = [
  'public',
  'docs',
  'AGENTS.md',
  'SKILL.md',
  'RULES.md',
  'TASKS.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'accdee-skill.md',
  '.env.example',
];

const sensitiveNames = [
  'JWT_SECRET',
  'ADMIN_PASSWORD',
  'DB_PASSWORD',
  'DB_PASS',
  'MYSQLPASSWORD',
  'CLOUDINARY_API_SECRET',
  'GMAIL_APP_PASSWORD',
  'RESEND_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_NOTIFY_BOT_TOKEN',
];

const allowedValuePatterns = [
  /^$/,
  /^\[/,
  /^</,
  /^your[_-]/i,
  /^change[_-]?me/i,
  /^example/i,
  /^optional/i,
  /^redacted/i,
  /^placeholder/i,
  /^set in /i,
  /^ดูจาก/i,
  /^←/,
];

const tokenPatterns = [
  { name: 'telegram bot token', re: /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/ },
  { name: 'resend api key', re: /\bre_[A-Za-z0-9_]{20,}\b/ },
  { name: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

const findings = [];

function shouldSkipDir(name) {
  return ['.git', 'node_modules', 'backups', 'uploads', '.claude'].includes(name);
}

function collectFiles(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];

  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!shouldSkipDir(entry.name)) files.push(...collectFiles(path.join(target, entry.name)));
      continue;
    }
    if (entry.isFile()) files.push(path.join(absolute, entry.name));
  }
  return files;
}

function isAllowedPlaceholder(value) {
  const clean = value.trim();
  return allowedValuePatterns.some((pattern) => pattern.test(clean));
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function addFinding(file, line, reason) {
  findings.push(`${relative(file)}:${line} ${reason}`);
}

function scanFile(file) {
  const rel = relative(file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const isPublic = rel.startsWith('public/');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const key of sensitiveNames) {
      if (isPublic && line.includes(key)) {
        addFinding(file, lineNumber, `sensitive variable name appears in public asset: ${key}`);
      }

      const assignment = line.match(new RegExp(`\\b${key}\\s*=\\s*([^\\r\\n]*)`, 'i'));
      if (assignment && !isAllowedPlaceholder(assignment[1])) {
        addFinding(file, lineNumber, `possible committed secret assignment: ${key}`);
      }
    }

    for (const pattern of tokenPatterns) {
      if (pattern.re.test(line)) {
        addFinding(file, lineNumber, `possible ${pattern.name}`);
      }
    }
  });
}

for (const target of scanTargets) {
  for (const file of collectFiles(target)) {
    scanFile(file);
  }
}

if (findings.length > 0) {
  console.error('Secret scan failed. Values are intentionally not printed.');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Secret scan OK');
