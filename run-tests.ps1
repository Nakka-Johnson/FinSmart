# Complete FinSmart API Test

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  FINSMART API TESTS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Login
Write-Host "`n[1/5] Logging in..." -ForegroundColor Yellow
$loginBody = '{"email":"test@finsmart.dev","password":"Test123!"}'
$resp = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $resp.token
$headers = @{Authorization="Bearer $token"}
Write-Host "  ✓ Logged in" -ForegroundColor Green

# Create Account
Write-Host "`n[2/5] Creating account..." -ForegroundColor Yellow
$accounts = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts" -Headers $headers

if ($accounts.Count -eq 0) {
    $accountBody = '{"name":"Test Checking","institution":"Test Bank","type":"CHECKING","currency":"GBP"}'
    $account = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts" -Method POST -Headers $headers -ContentType "application/json" -Body $accountBody
    $accountId = $account.id
    Write-Host "  ✓ Account created" -ForegroundColor Green
} else {
    $accountId = $accounts[0].id
    Write-Host "  ✓ Using existing account" -ForegroundColor Green
}

# Create Transactions
Write-Host "`n[3/5] Creating transactions..." -ForegroundColor Yellow
$today = Get-Date -Format "yyyy-MM-dd"

$tx1 = "{`"accountId`":`"$accountId`",`"postedAt`":`"$today`",`"amount`":50.00,`"direction`":`"OUT`",`"description`":`"Groceries`",`"merchant`":`"Tesco`"}"
$tx2 = "{`"accountId`":`"$accountId`",`"postedAt`":`"$today`",`"amount`":2500.00,`"direction`":`"IN`",`"description`":`"Salary`",`"merchant`":`"Employer`"}"
$tx3 = "{`"accountId`":`"$accountId`",`"postedAt`":`"$today`",`"amount`":850.00,`"direction`":`"OUT`",`"description`":`"Rent`",`"merchant`":`"Landlord`"}"

Invoke-RestMethod -Uri "http://localhost:8081/api/transactions" -Method POST -Headers $headers -ContentType "application/json" -Body $tx1 | Out-Null
Invoke-RestMethod -Uri "http://localhost:8081/api/transactions" -Method POST -Headers $headers -ContentType "application/json" -Body $tx2 | Out-Null
Invoke-RestMethod -Uri "http://localhost:8081/api/transactions" -Method POST -Headers $headers -ContentType "application/json" -Body $tx3 | Out-Null
Write-Host "  ✓ Created 3 transactions" -ForegroundColor Green

# Get Insights
Write-Host "`n[4/5] Getting Monthly Insights..." -ForegroundColor Yellow
$month = 11
$year = 2025
$insights = Invoke-RestMethod -Uri "http://localhost:8081/api/insights/monthly?month=$month&year=$year" -Headers $headers

Write-Host "  ✓ Insights retrieved!" -ForegroundColor Green
Write-Host "  📊 Total Debit:  £$($insights.totalDebit)" -ForegroundColor Red
Write-Host "  📈 Total Credit: £$($insights.totalCredit)" -ForegroundColor Green
Write-Host "  🏆 Biggest: $($insights.biggestCategory)" -ForegroundColor Yellow

# Download PDF
Write-Host "`n[5/5] Downloading PDF..." -ForegroundColor Yellow
$pdfPath = "D:\Dev\projects\finsmart\FinSmart_Report.pdf"
$pdfUrl = "http://localhost:8081/api/reports/pdf?month=" + $month + "&year=" + $year

Invoke-WebRequest -Uri $pdfUrl -Headers $headers -OutFile $pdfPath

if (Test-Path $pdfPath) {
    $size = (Get-Item $pdfPath).Length
    Write-Host "  ✓ PDF downloaded: $([math]::Round($size/1KB, 2)) KB" -ForegroundColor Green
    Write-Host "  📄 $pdfPath" -ForegroundColor Gray
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  TESTS COMPLETE!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
