const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/validate-restore-file.js <backup.sql>');
  process.exit(1);
}

const resolved = path.resolve(filePath);
if (!fs.existsSync(resolved)) {
  console.error(`Backup file not found: ${resolved}`);
  process.exit(1);
}

const stat = fs.statSync(resolved);
if (!stat.isFile() || stat.size === 0) {
  console.error('Backup file is empty or not a regular file');
  process.exit(1);
}

const sample = fs.readFileSync(resolved, { encoding: 'utf8', flag: 'r' }).slice(0, 1024 * 1024);
const hasMysqlDumpHeader = sample.includes('MySQL dump') || sample.includes('MariaDB dump');
const hasSchemaOrData = /CREATE TABLE|INSERT INTO|DROP TABLE|ALTER TABLE/i.test(sample);

if (!hasMysqlDumpHeader && !hasSchemaOrData) {
  console.error('Backup file does not look like a MySQL SQL dump');
  process.exit(1);
}

console.log(`Backup file looks restorable: ${resolved}`);
console.log(`Size: ${stat.size} bytes`);
console.log('This script only validates the file shape. It does not import or modify any database.');
