# Complete FinSmart API Test with Data Creation

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  FINSMART COMPLETE API TEST" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n[1/5] Logging in..." -ForegroundColor Yellow
$login = @{ 
    email = "test@finsmart.dev"
    password = "Test123!" 
} | ConvertTo-Json

$resp = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -ContentType "application/json" -Body $login
$token = $resp.token
$headers = @{Authorization="Bearer $token"}
Write-Host "  ✓ Logged in successfully" -ForegroundColor Green

# Step 2: Create Account
Write-Host "`n[2/5] Creating account..." -ForegroundColor Yellow
$accounts = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts" -Headers $headers

if ($accounts.Count -eq 0) {
    $newAccount = @{ 
        name = "Test Checking"
        institution = "Test Bank"
        type = "CHECKING"
        currency = "GBP"
    } | ConvertTo-Json
    
    $account = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts" -Method POST -Headers $headers -ContentType "application/json" -Body $newAccount
    $accountId = $account.id
    Write-Host "  ✓ Account created: $($account.name)" -ForegroundColor Green
} else {
    $accountId = $accounts[0].id
    Write-Host "  ✓ Using existing account: $($accounts[0].name)" -ForegroundColor Green
}

# Step 3: Create Transactions
Write-Host "`n[3/5] Creating transactions..." -ForegroundColor Yellow
$today = Get-Date -Format "yyyy-MM-dd"

$transactions = @(
    @{ accountId=$accountId; postedAt=$today; amount=50.00; direction="OUT"; description="Groceries"; merchant="Tesco" }
    @{ accountId=$accountId; postedAt=$today; amount=2500.00; direction="IN"; description="Salary"; merchant="Employer Corp" }
    @{ accountId=$accountId; postedAt=$today; amount=850.00; direction="OUT"; description="Rent Payment"; merchant="Landlord" }
    @{ accountId=$accountId; postedAt=$today; amount=45.50; direction="OUT"; description="Utilities"; merchant="British Gas" }
    @{ accountId=$accountId; postedAt=$today; amount=120.00; direction="OUT"; description="Shopping"; merchant="Amazon" }
)

foreach ($tx in $transactions) {
    $txJson = $tx | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8081/api/transactions" -Method POST -Headers $headers -ContentType "application/json" -Body $txJson | Out-Null
}
Write-Host "  ✓ Created $($transactions.Count) transactions" -ForegroundColor Green

# Step 4: Get Monthly Insights
Write-Host "`n[4/5] Getting Monthly Insights..." -ForegroundColor Yellow
$month = 11
$year = 2025

$insights = Invoke-RestMethod -Uri "http://localhost:8081/api/insights/monthly?month=$month&year=$year" -Headers $headers

Write-Host "  ✓ Insights retrieved!" -ForegroundColor Green
Write-Host ""
Write-Host "  📊 Total Debit:  £$($insights.totalDebit)" -ForegroundColor Red
Write-Host "  📈 Total Credit: £$($insights.totalCredit)" -ForegroundColor Green
Write-Host "  🏆 Biggest Category: $($insights.biggestCategory)" -ForegroundColor Yellow
Write-Host "  📋 Top Categories: $($insights.topCategories.Count)"
Write-Host "  ⚠️  Anomalies: $($insights.anomalies.Count)"
Write-Host "  🔮 Forecasts: $($insights.forecast.Count)"

# Step 5: Download PDF
Write-Host "`n[5/5] Downloading PDF Report..." -ForegroundColor Yellow
$pdfPath = "D:\Dev\projects\finsmart\FinSmart_Monthly_Report.pdf"

try {
    $pdfUrl = "http://localhost:8081/api/reports/pdf?month=$month" + "&year=$year"
    Invoke-WebRequest -Uri $pdfUrl -Headers $headers -OutFile $pdfPath -ErrorAction Stop
    
    if (Test-Path $pdfPath) {
        $size = (Get-Item $pdfPath).Length
        Write-Host "  ✓ PDF downloaded successfully!" -ForegroundColor Green
        Write-Host "  📄 File: $pdfPath" -ForegroundColor Gray
        Write-Host "  💾 Size: $([math]::Round($size/1KB, 2)) KB" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ PDF download failed: $_" -ForegroundColor Red
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  ALL TESTS COMPLETE!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
