# FinSmart API Test Script

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "FinSmart API Tests" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login
Write-Host "[1/3] Testing Login..." -ForegroundColor Yellow
try {
    $login = @{ 
        email = "john@example.com"
        password = "SuperSecret123!" 
    } | ConvertTo-Json
    
    $resp = Invoke-RestMethod `
        -Uri "http://localhost:8081/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $login `
        -ErrorAction Stop
    
    $token = $resp.token
    Write-Host "  ✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "  ✗ Login failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Attempting alternative user..." -ForegroundColor Yellow
    
    # Try alternative credentials
    $login2 = @{ 
        email = "alice@example.com"
        password = "password123" 
    } | ConvertTo-Json
    
    try {
        $resp = Invoke-RestMethod `
            -Uri "http://localhost:8081/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $login2 `
            -ErrorAction Stop
        
        $token = $resp.token
        Write-Host "  ✓ Login successful with alice@example.com!" -ForegroundColor Green
        Write-Host "  Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "  ✗ Alternative login also failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Test 2: Monthly Insights
Write-Host "[2/3] Testing Monthly Insights..." -ForegroundColor Yellow
try {
    $month = [int](Get-Date).ToString("MM")
    $year = [int](Get-Date).ToString("yyyy")
    
    $insights = Invoke-RestMethod `
        -Uri "http://localhost:8081/api/insights/monthly?month=$month&year=$year" `
        -Headers @{Authorization="Bearer $token"} `
        -ErrorAction Stop
    
    Write-Host "  ✓ Monthly insights retrieved!" -ForegroundColor Green
    Write-Host "  Month: $month/$year" -ForegroundColor Gray
    Write-Host "  Total Debit: £$($insights.totalDebit)" -ForegroundColor Gray
    Write-Host "  Total Credit: £$($insights.totalCredit)" -ForegroundColor Gray
    Write-Host "  Biggest Category: $($insights.biggestCategory)" -ForegroundColor Gray
    Write-Host "  Top Categories: $($insights.topCategories.Count)" -ForegroundColor Gray
    Write-Host "  Anomalies: $($insights.anomalies.Count)" -ForegroundColor Gray
    Write-Host "  Forecasts: $($insights.forecast.Count)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "  ✗ Monthly insights failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 3: PDF Download
Write-Host "[3/3] Testing PDF Download..." -ForegroundColor Yellow
try {
    $month = [int](Get-Date).ToString("MM")
    $year = [int](Get-Date).ToString("yyyy")
    $outputFile = "D:\Dev\projects\finsmart\FinSmart_Report_$year-$month.pdf"
    
    Invoke-WebRequest `
        -Uri "http://localhost:8081/api/reports/pdf?month=$month&year=$year" `
        -Headers @{Authorization="Bearer $token"} `
        -OutFile $outputFile `
        -ErrorAction Stop
    
    if (Test-Path $outputFile) {
        $fileSize = (Get-Item $outputFile).Length
        Write-Host "  ✓ PDF downloaded successfully!" -ForegroundColor Green
        Write-Host "  File: $outputFile" -ForegroundColor Gray
        Write-Host "  Size: $($fileSize) bytes" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ PDF file not found after download" -ForegroundColor Red
    }
    Write-Host ""
} catch {
    Write-Host "  ✗ PDF download failed: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Tests Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
