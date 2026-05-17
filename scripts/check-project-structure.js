const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const requiredPaths = [
  'server.js',
  'package.json',
  'package-lock.json',
  'railway.toml',
  '.env.example',
  '.gitignore',
  'AGENTS.md',
  'SKILL.md',
  'RULES.md',
  'TASKS.md',
  'CHANGELOG.md',
  'docs/ARCHITECTURE.md',
  'docs/AI_WORKFLOW_SKILL.md',
  'docs/BACKUP.md',
  'docs/BACKUP_RESTORE_SKILL.md',
  'docs/CUSTOMER_FLOW_SKILL.md',
  'docs/CUSTOMER_FLOW_TESTING.md',
  'docs/DEPLOYMENT.md',
  'docs/ENVIRONMENT_SAFETY_SKILL.md',
  'docs/FILE_OWNERS.md',
  'docs/MONITORING.md',
  'docs/PROJECT_MAP.md',
  'docs/PRODUCTION_CHECKLIST.md',
  'docs/PURCHASE_UX_SKILL.md',
  'docs/RESTORE.md',
  'docs/SEO_SKILL.md',
  'docs/SECURITY.md',
  'docs/SECURITY_OPERATIONS.md',
  'docs/SOURCE_CODE_EXPOSURE.md',
  'docs/TESTING.md',
  'config/db.js',
  'config/setupDb.js',
  'controllers/authController.js',
  'controllers/adminController.js',
  'controllers/shopController.js',
  'controllers/walletController.js',
  'middleware/authMiddleware.js',
  'middleware/adminMiddleware.js',
  'models/transactionModel.js',
  'routes/authRoutes.js',
  'routes/adminRoutes.js',
  'routes/shopRoutes.js',
  'routes/walletRoutes.js',
  'utils/fileValidation.js',
  'utils/jwtConfig.js',
  'utils/runtimeEnv.js',
  'utils/securityLogger.js',
  'public/index.html',
  'public/robots.txt',
  'public/shop.html',
  'public/sitemap.xml',
  'public/wallet.html',
  'public/admin.html',
  'public/admin-login.html',
  'public/css/style.css',
  'public/css/admin-style.css',
  'public/js/main.js',
  'public/js/admin-main.js',
  'public/js/admin-login.js',
  'scripts/backup-db.js',
  'scripts/check-backup-readiness.js',
  'scripts/check-secrets.js',
  'scripts/check-customer-flow.js',
  'scripts/check-env.js',
  'scripts/check-live-site.js',
  'scripts/check-seo.js',
  'scripts/check-storefront.js',
  'scripts/validate-restore-file.js',
  'tests/authAdmin.test.js',
  'tests/health.test.js',
  'tests/shopController.test.js',
  'tests/walletController.test.js',
  'tests/walletTopup.test.js',
];

const requiredDirs = [
  'config',
  'controllers',
  'middleware',
  'models',
  'routes',
  'utils',
  'public',
  'public/css',
  'public/js',
  'public/images',
  'scripts',
  'tests',
  'docs',
];

const requiredScripts = [
  'test',
  'check',
  'check:backup',
  'check:customer-flow',
  'check:env',
  'check:env:production',
  'check:live',
  'build',
  'check:db',
  'check:secrets',
  'check:seo',
  'check:storefront',
  'check:structure',
  'backup:db',
  'restore:check',
];

const requiredGitignoreEntries = [
  '.env',
  '.env.local',
  '.claude/',
  'node_modules/',
  'uploads/',
  'backups/',
  '*.sql',
  '*.sql.gz',
  '*.pem',
  '*.key',
];

const errors = [];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

for (const dir of requiredDirs) {
  const fullPath = path.join(root, dir);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    errors.push(`Missing directory: ${dir}`);
  }
}

for (const requiredPath of requiredPaths) {
  if (!exists(requiredPath)) {
    errors.push(`Missing required file: ${requiredPath}`);
  }
}

if (exists('package.json')) {
  const pkg = JSON.parse(read('package.json'));
  for (const scriptName of requiredScripts) {
    if (!pkg.scripts || !pkg.scripts[scriptName]) {
      errors.push(`Missing package script: ${scriptName}`);
    }
  }

  const checkScript = pkg.scripts && pkg.scripts.check ? pkg.scripts.check : '';
  if (!checkScript.includes('check:structure')) {
    errors.push('npm run check must include npm run check:structure');
  }
  if (!checkScript.includes('check:seo')) {
    errors.push('npm run check must include npm run check:seo');
  }
  if (!checkScript.includes('check:customer-flow')) {
    errors.push('npm run check must include npm run check:customer-flow');
  }
}

if (exists('.gitignore')) {
  const gitignore = read('.gitignore');
  for (const entry of requiredGitignoreEntries) {
    if (!gitignore.includes(entry)) {
      errors.push(`.gitignore should include: ${entry}`);
    }
  }
}

if (exists('railway.toml')) {
  const railwayToml = read('railway.toml');
  if (!railwayToml.includes('node server.js')) {
    errors.push('railway.toml should start the app with node server.js');
  }
  if (!railwayToml.includes('healthcheckPath')) {
    errors.push('railway.toml should define a healthcheckPath');
  }
}

if (exists('server.js')) {
  const serverJs = read('server.js');
  if (!serverJs.includes('module.exports')) {
    errors.push('server.js should export app/start helpers for tests');
  }
  if (!serverJs.includes('adminPageHeaders')) {
    errors.push('server.js should keep explicit admin page security headers');
  }
}

if (exists('SKILL.md')) {
  const skill = read('SKILL.md');
  for (const doc of ['docs/PROJECT_MAP.md', 'docs/AI_WORKFLOW_SKILL.md', 'docs/PURCHASE_UX_SKILL.md', 'docs/SEO_SKILL.md', 'docs/CUSTOMER_FLOW_SKILL.md', 'docs/ENVIRONMENT_SAFETY_SKILL.md', 'docs/BACKUP_RESTORE_SKILL.md']) {
    if (!skill.includes(doc)) {
      errors.push(`SKILL.md should reference ${doc}`);
    }
  }
}

if (exists('docs/PROJECT_MAP.md')) {
  const projectMap = read('docs/PROJECT_MAP.md');
  if (!projectMap.includes('C:\\Users\\PCCOPA\\Documents\\MyProjects\\accdee')) {
    errors.push('docs/PROJECT_MAP.md should identify the active repo');
  }
  if (!projectMap.includes('C:\\temp\\accdee_ARCHIVE_DO_NOT_USE')) {
    errors.push('docs/PROJECT_MAP.md should identify the archived repo');
  }
}

if (errors.length > 0) {
  console.error('Project structure check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Project structure check OK');
