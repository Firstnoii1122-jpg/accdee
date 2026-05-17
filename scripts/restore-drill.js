/**
 * restore-drill.js — ทดสอบ restore backup บนฐานข้อมูล accdee_drill (local เท่านั้น)
 *
 * ใช้: node scripts/restore-drill.js C:\path\to\backup.sql
 *
 * สิ่งที่ script นี้ทำ:
 *   1. ตรวจว่า backup file ถูกต้อง (ผ่าน validate-restore-file logic)
 *   2. สร้าง database ชื่อ accdee_drill บนเครื่องตัวเอง
 *   3. Import backup เข้า accdee_drill
 *   4. ตรวจ table และ row counts
 *   5. ลบ accdee_drill ทิ้งหลังเสร็จ
 *
 * ไม่แตะ production database เด็ดขาด
 */

require('dotenv').config();

const fs           = require('fs');
const path         = require('path');
const { spawnSync } = require('child_process');

const DRILL_DB = 'accdee_drill';

const backupPath = process.argv[2];
if (!backupPath) {
  console.error('Usage: node scripts/restore-drill.js <backup.sql>');
  process.exit(1);
}

const resolvedPath = path.resolve(backupPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

// ห้ามรันบน production
const { isProductionRuntime } = require('../utils/runtimeEnv');
if (isProductionRuntime()) {
  console.error('REFUSED: restore-drill must not run in production mode.');
  process.exit(1);
}

function getEnv(...names) {
  for (const n of names) if (process.env[n]) return process.env[n];
  return '';
}

const host     = getEnv('MYSQLHOST', 'DB_HOST') || 'localhost';
const port     = getEnv('MYSQLPORT', 'DB_PORT') || '3306';
const user     = getEnv('MYSQLUSER', 'DB_USER') || 'root';
const password = getEnv('MYSQLPASSWORD', 'DB_PASSWORD', 'DB_PASS') || '';

const mysqlEnv = { ...process.env, MYSQL_PWD: password };

function mysql(args, input) {
  return spawnSync('mysql', ['-h', host, '-P', port, '-u', user, ...args], {
    env  : mysqlEnv,
    input: input || undefined,
    encoding: 'utf8',
  });
}

// ──────────────────────────────────────────
// Step 1: Validate backup file
// ──────────────────────────────────────────
console.log(`\n[1/4] Validating backup file: ${resolvedPath}`);

const content = fs.readFileSync(resolvedPath, 'utf8');
const hasSqlMarkers = /CREATE TABLE|INSERT INTO|DROP TABLE|ALTER TABLE/i.test(content);
if (!hasSqlMarkers) {
  console.error('FAIL: File does not look like a valid SQL dump.');
  process.exit(1);
}
console.log('      OK — SQL dump markers found');

// ──────────────────────────────────────────
// Step 2: Create drill database
// ──────────────────────────────────────────
console.log(`\n[2/4] Creating drill database: ${DRILL_DB}`);

const createResult = mysql([], `DROP DATABASE IF EXISTS \`${DRILL_DB}\`; CREATE DATABASE \`${DRILL_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
if (createResult.status !== 0) {
  console.error('FAIL: Cannot create drill database.');
  if (createResult.stderr) console.error(createResult.stderr);
  process.exit(1);
}
console.log(`      OK — ${DRILL_DB} created`);

// ──────────────────────────────────────────
// Step 3: Import backup
// ──────────────────────────────────────────
console.log(`\n[3/4] Importing backup into ${DRILL_DB}...`);

const importResult = mysql([DRILL_DB], content);
if (importResult.status !== 0) {
  console.error('FAIL: Import failed.');
  if (importResult.stderr) console.error(importResult.stderr.replace(password, '[REDACTED]'));
  mysql([], `DROP DATABASE IF EXISTS \`${DRILL_DB}\`;`);
  process.exit(1);
}
console.log('      OK — import complete');

// ──────────────────────────────────────────
// Step 4: Validate table and row counts
// ──────────────────────────────────────────
console.log(`\n[4/4] Validating tables in ${DRILL_DB}...`);

const requiredTables = ['users', 'transactions', 'inventory', 'orders', 'products', 'coupons'];
let allPassed = true;

for (const table of requiredTables) {
  const r = mysql([DRILL_DB, '-se', `SELECT COUNT(*) FROM \`${table}\`;`]);
  if (r.status !== 0) {
    console.error(`      FAIL: table "${table}" not found or error`);
    allPassed = false;
  } else {
    const count = (r.stdout || '').trim();
    console.log(`      ${table}: ${count} rows`);
  }
}

// ──────────────────────────────────────────
// Cleanup — drop drill database
// ──────────────────────────────────────────
mysql([], `DROP DATABASE IF EXISTS \`${DRILL_DB}\`;`);
console.log(`\n      Drill database "${DRILL_DB}" dropped — no changes to production.\n`);

if (!allPassed) {
  console.error('Restore drill FAILED — some tables are missing.');
  process.exit(1);
}

console.log('Restore drill PASSED — backup is importable and all required tables exist.');
console.log('This does not modify any production database.\n');
