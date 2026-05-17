require('dotenv').config();

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function getEnv(...names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return '';
}

const config = {
  host: getEnv('MYSQLHOST', 'DB_HOST'),
  port: getEnv('MYSQLPORT', 'DB_PORT') || '3306',
  user: getEnv('MYSQLUSER', 'DB_USER'),
  password: getEnv('MYSQLPASSWORD', 'DB_PASSWORD', 'DB_PASS'),
  database: getEnv('MYSQLDATABASE', 'DB_NAME'),
};

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  console.error(`Missing database configuration: ${missing.join(', ')}`);
  process.exit(1);
}

const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(backupDir, `accdee_${timestamp}.sql`);
const output = fs.createWriteStream(outputPath, { flags: 'wx' });

const args = [
  '--single-transaction',
  '--quick',
  '--skip-lock-tables',
  '-h', config.host,
  '-P', String(config.port),
  '-u', config.user,
  config.database,
];

const child = spawn('mysqldump', args, {
  env: {
    ...process.env,
    MYSQL_PWD: config.password,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

child.stdout.pipe(output);

let stderr = '';
child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

child.on('error', (error) => {
  output.destroy();
  try { fs.unlinkSync(outputPath); } catch {}
  if (error.code === 'ENOENT') {
    console.error('mysqldump not found. Install MySQL client tools or run backup from an environment that has mysqldump.');
  } else {
    console.error(`Backup failed: ${error.message}`);
  }
  process.exit(1);
});

child.on('close', (code) => {
  output.end();
  if (code !== 0) {
    try { fs.unlinkSync(outputPath); } catch {}
    console.error(`mysqldump failed with exit code ${code}`);
    if (stderr) console.error(stderr.replace(config.password, '[REDACTED]'));
    process.exit(code || 1);
  }
  console.log(`Backup created: ${outputPath}`);
});
