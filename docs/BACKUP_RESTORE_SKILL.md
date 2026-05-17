# ACCDEE Backup Restore Skill

Use this skill when changing backup scripts, restore validation, rollback notes, or disaster recovery procedures.

> **PROJECT BOUNDARY:** ไฟล์นี้เป็นของ ACCDEE เท่านั้น (accdee.shop)
> ห้าม reference candy365 / candy365.online ในทุกกรณี

## Backup Channel

```
ช่องทาง:   DBeaver → Railway MySQL (accdee project)
Railway:   account Firstnoii_1122@icloud.com
ที่เก็บ:   Google Drive (ห้าม commit .sql ลง repo)
ก่อน restore: ต้องรัน npm run restore:check ก่อนเสมอ
```

## Goal

Make sure ACCDEE can recover from database loss, bad deploys, missing Railway variables, and accidental data damage.

Backup and restore work must be conservative. Never run a destructive restore against production unless the owner explicitly approves it and a fresh backup exists.

## Main Files

- `scripts/backup-db.js`
- `scripts/validate-restore-file.js`
- `scripts/check-backup-readiness.js`
- `docs/BACKUP.md`
- `docs/RESTORE.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `.gitignore`

## Safe Rules

- Do not commit `.sql`, `.sql.gz`, or the `backups/` folder.
- Do not print database passwords.
- Do not import a backup automatically.
- Validate a backup file shape before restore.
- Use a staging/local database for restore drills.
- Keep rollback and restore steps documented.

## Commands

Read-only readiness check:

```powershell
npm run check:backup
```

Create a backup when DB env and `mysqldump` are available:

```powershell
npm run backup:db
```

Validate a backup file before any restore:

```powershell
npm run restore:check -- C:\path\to\backup.sql
```

## Handoff

Report:

- Whether backup scripts exist.
- Whether backup files are ignored by Git.
- Whether restore validation exists.
- Whether `mysqldump` is available as a warning, not as a code failure.
- Whether any destructive operation was avoided.

