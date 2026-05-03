$base = "http://localhost:3000/api"

Write-Host "`n=== TEST 1: Register ===" -ForegroundColor Cyan
$body = '{"username":"testuser","email":"test@gmail.com","password":"123456"}'
Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType "application/json" -Body $body | ConvertTo-Json

Write-Host "`n=== TEST 2: Login ===" -ForegroundColor Cyan
$body = '{"email":"test@gmail.com","password":"123456"}'
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $body
$login | ConvertTo-Json
$token = $login.token

Write-Host "`n=== TEST 3: Profile with Token ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/profile" -Method GET -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json

Write-Host "`n=== TEST 4: Profile without Token ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/profile" -Method GET | ConvertTo-Json
} catch {
    $_.ErrorDetails.Message
}

Write-Host "`n=== DONE ===" -ForegroundColor Green
