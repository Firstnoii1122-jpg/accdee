const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.BACKUP_HOST || 'autorack.proxy.rlwy.net',
  port: parseInt(process.env.BACKUP_PORT || '22344'),
  user: process.env.BACKUP_USER || 'accdee_user',
  password: process.env.BACKUP_PASS || 'accdee_pass_2024',
  database: process.env.BACKUP_DB || 'accdee_site',
  ssl: { rejectUnauthorized: false },
};

const backupDir = path.join(process.cwd(), 'backups');
fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outputPath = path.join(backupDir, `accdee_${timestamp}.sql`);

async function backup() {
  console.log('เชื่อมต่อ Railway MySQL...');
  const conn = await mysql.createConnection(config);

  const lines = [];
  lines.push(`-- ACCDEE Database Backup`);
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push(`-- Host: ${config.host}:${config.port}`);
  lines.push(`SET FOREIGN_KEY_CHECKS=0;`);
  lines.push('');

  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map(r => Object.values(r)[0]);
  console.log(`พบ ${tableNames.length} ตาราง: ${tableNames.join(', ')}`);

  for (const table of tableNames) {
    console.log(`  backup: ${table}`);

    const [[createRow]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createRow['Create Table'];

    lines.push(`-- Table: ${table}`);
    lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
    lines.push(`${createSql};`);
    lines.push('');

    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      for (const row of rows) {
        const vals = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof v === 'number') return String(v);
          return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        }).join(', ');
        lines.push(`INSERT INTO \`${table}\` (${cols}) VALUES (${vals});`);
      }
      lines.push('');
    }
  }

  lines.push('SET FOREIGN_KEY_CHECKS=1;');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

  await conn.end();
  const sizeKb = Math.round(fs.statSync(outputPath).size / 1024);
  console.log(`\nBackup สำเร็จ! (${sizeKb} KB)`);
  console.log(`ไฟล์: ${outputPath}`);
  console.log(`\nขั้นตอนต่อไป: อัปโหลดไฟล์นี้ไปยัง Google Drive`);
}

backup().catch(err => {
  console.error('Backup ล้มเหลว:', err.message);
  process.exit(1);
});
