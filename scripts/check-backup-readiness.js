const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function requireFile(relativePath) {
  if (!exists(relativePath)) {
    errors.push(`Missing file: ${relativePath}`);
    return '';
  }
  return read(relativePath);
}

const pkg = JSON.parse(requireFile('package.json') || '{}');
const gitignore = requireFile('.gitignore');
const backupScript = requireFile('scripts/backup-db.js');
const restoreScript = requireFile('scripts/validate-restore-file.js');
const backupDoc = requireFile('docs/BACKUP.md');
const restoreDoc = requireFile('docs/RESTORE.md');

for (const scriptName of ['backup:db', 'restore:check', 'check:backup']) {
  if (!pkg.scripts || !pkg.scripts[scriptName]) {
    errors.push(`Missing package script: ${scriptName}`);
  }
}

for (const ignoreEntry of ['backups/', '*.sql', '*.sql.gz']) {
  if (!gitignore.includes(ignoreEntry)) {
    errors.push(`.gitignore should include ${ignoreEntry}`);
  }
}

if (!backupScript.includes('MYSQL_PWD')) {
  errors.push('backup-db.js should pass DB password through MYSQL_PWD instead of command arguments');
}

if (!backupScript.includes('[REDACTED]') || !backupScript.includes('replace(config.password')) {
  errors.push('backup-db.js should redact database passwords from error output');
}

if (!backupScript.includes('--single-transaction')) {
  warnings.push('backup-db.js should use --single-transaction for safer MySQL dumps');
}

if (!restoreScript.includes('does not import or modify any database')) {
  errors.push('validate-restore-file.js should clearly stay read-only');
}

if (!/CREATE TABLE|INSERT INTO|DROP TABLE|ALTER TABLE/.test(restoreScript)) {
  errors.push('validate-restore-file.js should check for SQL dump content markers');
}

for (const doc of [
  { name: 'docs/BACKUP.md', content: backupDoc, marker: 'npm run backup:db' },
  { name: 'docs/RESTORE.md', content: restoreDoc, marker: 'npm run restore:check' },
]) {
  if (!doc.content.includes(doc.marker)) {
    errors.push(`${doc.name} should mention ${doc.marker}`);
  }
}

const mysqlDumpCheck = spawnSync('mysqldump', ['--version'], { encoding: 'utf8' });
if (mysqlDumpCheck.error && mysqlDumpCheck.error.code === 'ENOENT') {
  warnings.push('mysqldump not found on this machine; backup:db needs MySQL client tools or Railway/DBeaver export');
} else if (mysqlDumpCheck.status !== 0) {
  warnings.push('mysqldump exists but did not return a clean version response');
}

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (errors.length > 0) {
  console.error('Backup readiness check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Backup readiness check OK (${warnings.length} warning(s))`);
console.log('No database restore or destructive operation was performed.');
