# deploy.ps1 — คู่มือ deploy ACCDEE ขึ้น Railway ทีละขั้น
# รัน: .\scripts\deploy.ps1

$ErrorActionPreference = 'Stop'

function Step($n, $title) {
  Write-Host ""
  Write-Host "[$n] $title" -ForegroundColor Cyan
  Write-Host ("─" * 50) -ForegroundColor DarkGray
}

function Ok($msg)   { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "  ℹ  $msg" -ForegroundColor Yellow }
function Err($msg)  { Write-Host "  ❌ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  ACCDEE — Railway Deploy Script"       -ForegroundColor Magenta
Write-Host "══════════════════════════════════════" -ForegroundColor Magenta

# ────────────────────────────────────────
Step 1 "ตรวจ Railway CLI"
# ────────────────────────────────────────
$railwayCli = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayCli) {
  Err "ไม่พบ railway CLI"
  Info "ติดตั้งด้วย: npm install -g @railway/cli"
  Info "แล้วรัน script นี้ใหม่"
  exit 1
}
Ok "railway CLI พบแล้ว: $($railwayCli.Source)"

# ────────────────────────────────────────
Step 2 "ตรวจ git status"
# ────────────────────────────────────────
$dirty = git status --porcelain
if ($dirty) {
  Err "มีไฟล์ที่ยังไม่ commit:"
  git status --short
  Info "commit ก่อน: git add . && git commit -m 'your message'"
  exit 1
}
Ok "Working tree สะอาด — พร้อม deploy"

# ────────────────────────────────────────
Step 3 "ตรวจ npm checks"
# ────────────────────────────────────────
Info "กำลังรัน npm run check:secrets..."
npm run check:secrets --silent
if ($LASTEXITCODE -ne 0) { Err "check:secrets ล้มเหลว — ห้าม deploy"; exit 1 }
Ok "check:secrets ผ่าน"

Info "กำลังรัน npm run check:structure..."
npm run check:structure --silent
if ($LASTEXITCODE -ne 0) { Err "check:structure ล้มเหลว — ห้าม deploy"; exit 1 }
Ok "check:structure ผ่าน"

# ────────────────────────────────────────
Step 4 "Login Railway ด้วย accdee account"
# ────────────────────────────────────────
Info "Account ที่ต้องใช้: Firstnoii_1122@icloud.com"
Info "กำลัง logout account เดิมก่อน..."
railway logout 2>$null

Info "เปิด browser login... (กด Enter ใน browser แล้วกลับมาที่นี่)"
railway login
if ($LASTEXITCODE -ne 0) { Err "Login ล้มเหลว"; exit 1 }
Ok "Login สำเร็จ"

# ────────────────────────────────────────
Step 5 "Link Railway project"
# ────────────────────────────────────────
Info "Project ID: 95b47776-e7cd-41a4-82f6-667d506f43e7"
railway link --project 95b47776-e7cd-41a4-82f6-667d506f43e7
if ($LASTEXITCODE -ne 0) { Err "Link ล้มเหลว — ตรวจสอบ Project ID"; exit 1 }
Ok "Link project สำเร็จ"

# ────────────────────────────────────────
Step 6 "Deploy"
# ────────────────────────────────────────
Info "กำลัง deploy... (อาจใช้เวลา 2-5 นาที)"
railway up
if ($LASTEXITCODE -ne 0) { Err "Deploy ล้มเหลว — ดู error ด้านบน"; exit 1 }
Ok "Deploy สำเร็จ!"

# ────────────────────────────────────────
Step 7 "ขั้นตอนต่อไป (ทำเองใน Railway Dashboard)"
# ────────────────────────────────────────
Write-Host ""
Write-Host "  ทำต่อบน Railway Dashboard:" -ForegroundColor White
Write-Host "  1. เข้า railway.com → accdee project → service → Variables" -ForegroundColor Gray
Write-Host "  2. ตั้งค่าทุกตัวจาก .env (อย่าลืม NODE_ENV=production)" -ForegroundColor Gray
Write-Host "  3. เปิด https://www.accdee.shop/api/health → ต้องเห็น {ok:true}" -ForegroundColor Gray
Write-Host "  4. ทดสอบ: สมัคร / login / ซื้อสินค้า / เติมเงิน" -ForegroundColor Gray
Write-Host "  5. uptimerobot.com → Add Monitor → https://www.accdee.shop/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor Green
Write-Host "  Deploy เสร็จสมบูรณ์! 🎉"             -ForegroundColor Green
Write-Host "══════════════════════════════════════" -ForegroundColor Green
Write-Host ""
