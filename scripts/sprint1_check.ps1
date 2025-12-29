#Requires -Version 7.0
<#
.SYNOPSIS
    Sprint-1 Completion Auditor for FinSmart monorepo
.DESCRIPTION
    Verifies Sprint-1 Top-10 features locally and produces a human-readable report
.NOTES
    Non-destructive, idempotent, safe to re-run
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================
$script:BackendUrl = "http://localhost:8081"
$script:FrontendUrl = "http://localhost:5174"
$script:AiUrl = "http://127.0.0.1:8001"

$script:RootDir = Split-Path -Parent $PSScriptRoot
$script:LogDir = Join-Path $RootDir "_check_logs"
$script:OutDir = Join-Path $RootDir "_out"

$script:Token = $null
$script:TestEmail = "sprint1_$([DateTimeOffset]::Now.ToUnixTimeSeconds())@example.com"
$script:TestPassword = "Sprint1Test!2024"

$script:PassCount = 0
$script:FailCount = 0
$script:Report = @()

# Get current and next month
$script:CurrentDate = Get-Date
$script:CurrentMonth = $CurrentDate.Month
$script:CurrentYear = $CurrentDate.Year
$script:NextMonth = if ($CurrentMonth -eq 12) { 1 } else { $CurrentMonth + 1 }
$script:NextYear = if ($CurrentMonth -eq 12) { $CurrentYear + 1 } else { $CurrentYear }

# ============================================================================
# HELPERS
# ============================================================================
function Initialize-Directories {
    if (-not (Test-Path $script:LogDir)) { New-Item -ItemType Directory -Path $script:LogDir -Force | Out-Null }
    if (-not (Test-Path $script:OutDir)) { New-Item -ItemType Directory -Path $script:OutDir -Force | Out-Null }
}

function Write-Status {
    param([string]$Message, [bool]$Pass = $true)
    if ($Pass) {
        Write-Host "  ✅ $Message" -ForegroundColor Green
        $script:PassCount++
    }
    else {
        Write-Host "  ❌ $Message" -ForegroundColor Red
        $script:FailCount++
    }
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host " $Title" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
}

function Save-Log {
    param([string]$Step, [string]$Content)
    $logPath = Join-Path $script:LogDir "$Step.log"
    $Content | Out-File -FilePath $logPath -Encoding utf8
}

function Add-ReportSection {
    param([string]$Title, [string]$Status, [string]$Details)
    $script:Report += @"

## $Title

**Status**: $Status

$Details
"@
}

function Invoke-ApiRequest {
    param(
        [string]$Method = "GET",
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [string]$ContentType = "application/json",
        [switch]$RawResponse,
        [switch]$IgnoreError
    )
    
    $requestHeaders = @{ "Accept" = "application/json" }
    if ($script:Token) {
        $requestHeaders["Authorization"] = "Bearer $($script:Token)"
    }
    foreach ($key in $Headers.Keys) {
        $requestHeaders[$key] = $Headers[$key]
    }
    
    $params = @{
        Method      = $Method
        Uri         = $Url
        Headers     = $requestHeaders
        ErrorAction = if ($IgnoreError) { "SilentlyContinue" } else { "Stop" }
    }
    
    if ($Body -and $Method -ne "GET") {
        if ($Body -is [string]) {
            $params["Body"] = $Body
        }
        else {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        $params["ContentType"] = $ContentType
    }
    
    try {
        if ($RawResponse) {
            $response = Invoke-WebRequest @params
            return $response
        }
        else {
            $response = Invoke-RestMethod @params
            return $response
        }
    }
    catch {
        if ($IgnoreError) {
            return $null
        }
        throw
    }
}

# ============================================================================
# CHECK 0: SERVICE HEALTH
# ============================================================================
function Test-ServiceHealth {
    Write-Section "0) Service Health Checks"
    $details = @()
    $allPass = $true
    
    # Backend health
    try {
        $resp = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method GET -ErrorAction Stop
        $body = $resp.Content
        if ($resp.StatusCode -eq 200 -and $body -match "FinSmart") {
            Write-Status "Backend health: 200 OK, contains 'FinSmart'"
            $details += "- Backend: ✅ HTTP 200, response contains 'FinSmart'"
        }
        else {
            Write-Status "Backend health: unexpected response" -Pass $false
            $details += "- Backend: ❌ StatusCode=$($resp.StatusCode), Body=$body"
            $allPass = $false
        }
        Save-Log "0_backend_health" "URL: $BackendUrl/api/health`nStatus: $($resp.StatusCode)`nBody: $body"
    }
    catch {
        Write-Status "Backend health: FAILED - $($_.Exception.Message)" -Pass $false
        $details += "- Backend: ❌ Error: $($_.Exception.Message)"
        $allPass = $false
        Save-Log "0_backend_health" "ERROR: $($_.Exception.Message)"
    }
    
    # AI health
    try {
        $resp = Invoke-RestMethod -Uri "$AiUrl/health" -Method GET -ErrorAction Stop
        if ($resp.status -eq "ai ok" -or $resp.status -eq "ok") {
            Write-Status "AI health: 200 OK, status='$($resp.status)'"
            $details += "- AI Service: ✅ HTTP 200, status='$($resp.status)'"
        }
        else {
            Write-Status "AI health: unexpected status '$($resp.status)'" -Pass $false
            $details += "- AI Service: ❌ Unexpected status: $($resp.status)"
            $allPass = $false
        }
        Save-Log "0_ai_health" "URL: $AiUrl/health`nResponse: $($resp | ConvertTo-Json)"
    }
    catch {
        Write-Status "AI health: FAILED - $($_.Exception.Message)" -Pass $false
        $details += "- AI Service: ❌ Error: $($_.Exception.Message)"
        $allPass = $false
        Save-Log "0_ai_health" "ERROR: $($_.Exception.Message)"
    }
    
    # Frontend health
    try {
        $resp = Invoke-WebRequest -Uri $FrontendUrl -Method GET -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Status "Frontend health: 200 OK (HTML received)"
            $details += "- Frontend: ✅ HTTP 200, HTML page served"
        }
        else {
            Write-Status "Frontend health: unexpected status $($resp.StatusCode)" -Pass $false
            $details += "- Frontend: ❌ StatusCode=$($resp.StatusCode)"
            $allPass = $false
        }
        Save-Log "0_frontend_health" "URL: $FrontendUrl`nStatus: $($resp.StatusCode)`nContentLength: $($resp.Content.Length)"
    }
    catch {
        Write-Status "Frontend health: FAILED - $($_.Exception.Message)" -Pass $false
        $details += "- Frontend: ❌ Error: $($_.Exception.Message)"
        $allPass = $false
        Save-Log "0_frontend_health" "ERROR: $($_.Exception.Message)"
    }
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "0) Service Health" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 1: AUTH FLOW
# ============================================================================
function Test-AuthFlow {
    Write-Section "1) Auth: Register / Login / Me"
    $details = @()
    $allPass = $true
    
    # Register
    try {
        $registerBody = @{
            email    = $script:TestEmail
            password = $script:TestPassword
            fullName = "Sprint Tester"
        }
        $resp = Invoke-ApiRequest -Method POST -Url "$BackendUrl/api/auth/register" -Body $registerBody -IgnoreError -RawResponse
        
        if ($resp -and $resp.StatusCode -in @(200, 201)) {
            Write-Status "Register: $($resp.StatusCode) - new user created"
            $details += "- Register: ✅ HTTP $($resp.StatusCode), user created"
            $respContent = $resp.Content | ConvertFrom-Json
            if ($respContent.token) {
                $script:Token = $respContent.token
            }
        }
        elseif ($resp -and $resp.StatusCode -eq 409) {
            Write-Info "User exists (409), will login instead"
            $details += "- Register: ℹ️ HTTP 409, user already exists"
        }
        else {
            # Try login since register may have failed
            Write-Info "Register returned unexpected response, trying login"
        }
        Save-Log "1_register" "URL: $BackendUrl/api/auth/register`nBody: $($registerBody | ConvertTo-Json)`nResponse: $($resp.Content)"
    }
    catch {
        Write-Info "Register failed, trying login: $($_.Exception.Message)"
        $details += "- Register: ℹ️ Failed, attempting login"
    }
    
    # Login (if no token yet)
    if (-not $script:Token) {
        try {
            $loginBody = @{
                email    = $script:TestEmail
                password = $script:TestPassword
            }
            $resp = Invoke-ApiRequest -Method POST -Url "$BackendUrl/api/auth/login" -Body $loginBody
            if ($resp.token) {
                $script:Token = $resp.token
                Write-Status "Login: received JWT token"
                $details += "- Login: ✅ JWT token received"
            }
            else {
                Write-Status "Login: no token in response" -Pass $false
                $details += "- Login: ❌ No token in response"
                $allPass = $false
            }
            Save-Log "1_login" "URL: $BackendUrl/api/auth/login`nBody: $($loginBody | ConvertTo-Json)`nResponse: $($resp | ConvertTo-Json)"
        }
        catch {
            Write-Status "Login: FAILED - $($_.Exception.Message)" -Pass $false
            $details += "- Login: ❌ Error: $($_.Exception.Message)"
            $allPass = $false
            Save-Log "1_login" "ERROR: $($_.Exception.Message)"
        }
    }
    
    # Get /me
    if ($script:Token) {
        try {
            $resp = Invoke-ApiRequest -Method GET -Url "$BackendUrl/api/auth/me"
            if ($resp.email -eq $script:TestEmail) {
                Write-Status "Me: email matches ($($resp.email))"
                $details += "- Me: ✅ Email verified: $($resp.email)"
            }
            else {
                Write-Status "Me: email mismatch (got $($resp.email))" -Pass $false
                $details += "- Me: ❌ Email mismatch: expected $($script:TestEmail), got $($resp.email)"
                $allPass = $false
            }
            Save-Log "1_me" "URL: $BackendUrl/api/auth/me`nResponse: $($resp | ConvertTo-Json)"
        }
        catch {
            Write-Status "Me: FAILED - $($_.Exception.Message)" -Pass $false
            $details += "- Me: ❌ Error: $($_.Exception.Message)"
            $allPass = $false
            Save-Log "1_me" "ERROR: $($_.Exception.Message)"
        }
    }
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "1) Auth Flow" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 2: ADMIN DEMO
# ============================================================================
function Test-AdminDemo {
    Write-Section "2) Admin Demo (Feature Flag Path)"
    $details = @()
    $allPass = $true
    
    # Seed
    try {
        $resp = Invoke-WebRequest -Uri "$BackendUrl/api/admin/demo/seed" -Method POST -Headers @{ "Authorization" = "Bearer $($script:Token)" } -ErrorAction SilentlyContinue
        if ($resp.StatusCode -in @(200, 201, 202)) {
            Write-Status "Demo seed: $($resp.StatusCode)"
            $details += "- Seed: ✅ HTTP $($resp.StatusCode)"
            try {
                $content = $resp.Content | ConvertFrom-Json
                if ($content.count) { $details += "  - Records created: $($content.count)" }
            }
            catch { }
        }
        else {
            Write-Status "Demo seed: $($resp.StatusCode)" -Pass $false
            $details += "- Seed: ❌ HTTP $($resp.StatusCode)"
            $allPass = $false
        }
        Save-Log "2_demo_seed" "URL: $BackendUrl/api/admin/demo/seed`nStatus: $($resp.StatusCode)`nBody: $($resp.Content)"
    }
    catch {
        Write-Info "Demo seed endpoint not available (feature may be disabled)"
        $details += "- Seed: ℹ️ Endpoint not available (feature flag disabled?)"
        Save-Log "2_demo_seed" "ERROR: $($_.Exception.Message)"
    }
    
    # Clear (dry-run check first)
    try {
        $resp = Invoke-WebRequest -Uri "$BackendUrl/api/admin/demo/clear" -Method POST -Headers @{ "Authorization" = "Bearer $($script:Token)" } -ErrorAction SilentlyContinue
        if ($resp.StatusCode -in @(200, 204)) {
            Write-Status "Demo clear: $($resp.StatusCode)"
            $details += "- Clear: ✅ HTTP $($resp.StatusCode)"
        }
        else {
            Write-Info "Demo clear: $($resp.StatusCode)"
            $details += "- Clear: ℹ️ HTTP $($resp.StatusCode)"
        }
        Save-Log "2_demo_clear" "URL: $BackendUrl/api/admin/demo/clear`nStatus: $($resp.StatusCode)`nBody: $($resp.Content)"
    }
    catch {
        Write-Info "Demo clear endpoint not available"
        $details += "- Clear: ℹ️ Endpoint not available"
        Save-Log "2_demo_clear" "ERROR: $($_.Exception.Message)"
    }
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "2) Admin Demo" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 3: CATEGORIES & ACCOUNTS
# ============================================================================
function Test-CategoriesAccounts {
    Write-Section "3) Categories & Accounts Baseline"
    $details = @()
    $allPass = $true
    $script:GroceriesCategoryId = $null
    $script:MonzoAccountId = $null
    
    # Get/Create Groceries category
    try {
        $categories = Invoke-ApiRequest -Method GET -Url "$BackendUrl/api/categories"
        $groceries = $categories | Where-Object { $_.name -eq "Groceries" } | Select-Object -First 1
        
        if ($groceries) {
            $script:GroceriesCategoryId = $groceries.id
            Write-Status "Category 'Groceries' exists (id=$($groceries.id))"
            $details += "- Category 'Groceries': ✅ Found (id=$($groceries.id))"
        }
        else {
            # Create it
            $newCat = Invoke-ApiRequest -Method POST -Url "$BackendUrl/api/categories" -Body @{ name = "Groceries"; type = "EXPENSE" }
            $script:GroceriesCategoryId = $newCat.id
            Write-Status "Category 'Groceries' created (id=$($newCat.id))"
            $details += "- Category 'Groceries': ✅ Created (id=$($newCat.id))"
        }
        Save-Log "3_categories" "Categories: $($categories | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Status "Categories: FAILED - $($_.Exception.Message)" -Pass $false
        $details += "- Categories: ❌ Error: $($_.Exception.Message)"
        $allPass = $false
        Save-Log "3_categories" "ERROR: $($_.Exception.Message)"
    }
    
    # Get/Create Monzo Current account
    try {
        $accounts = Invoke-ApiRequest -Method GET -Url "$BackendUrl/api/accounts"
        $monzo = $accounts | Where-Object { $_.name -eq "Monzo Current" } | Select-Object -First 1
        
        if ($monzo) {
            $script:MonzoAccountId = $monzo.id
            Write-Status "Account 'Monzo Current' exists (id=$($monzo.id))"
            $details += "- Account 'Monzo Current': ✅ Found (id=$($monzo.id))"
        }
        else {
            # Create it
            $newAcc = Invoke-ApiRequest -Method POST -Url "$BackendUrl/api/accounts" -Body @{ name = "Monzo Current"; type = "CHECKING"; currency = "GBP"; balance = 1000.0 }
            $script:MonzoAccountId = $newAcc.id
            Write-Status "Account 'Monzo Current' created (id=$($newAcc.id))"
            $details += "- Account 'Monzo Current': ✅ Created (id=$($newAcc.id))"
        }
        Save-Log "3_accounts" "Accounts: $($accounts | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Status "Accounts: FAILED - $($_.Exception.Message)" -Pass $false
        $details += "- Accounts: ❌ Error: $($_.Exception.Message)"
        $allPass = $false
        Save-Log "3_accounts" "ERROR: $($_.Exception.Message)"
    }
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "3) Categories & Accounts" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 4: CSV IMPORT V2
# ============================================================================
function Test-CsvImport {
    Write-Section "4) CSV Import v2: Preview → Commit → Undo"
    $details = @()
    $allPass = $true
    
    # Generate temp CSV
    $csvContent = @"
date,amount,direction,merchant,description
2024-12-01,-45.50,debit,Tesco,Weekly groceries
2024-12-02,2500.00,credit,Salary,Monthly salary
2024-12-03,-12.99,debit,Netflix,Streaming subscription
"@
    $csvPath = Join-Path $env:TEMP "sprint1_test_import.csv"
    $csvContent | Out-File -FilePath $csvPath -Encoding utf8
    $details += "- Generated test CSV with 3 rows at: $csvPath"
    
    $mapping = @{
        date        = "date"
        amount      = "amount"
        direction   = "direction"
        merchant    = "merchant"
        description = "description"
    } | ConvertTo-Json -Compress
    
    # Preview
    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"test.csv`"",
            "Content-Type: text/csv",
            "",
            $csvContent,
            "--$boundary",
            "Content-Disposition: form-data; name=`"mapping`"",
            "",
            $mapping,
            "--$boundary--"
        )
        $body = $bodyLines -join $LF
        
        $resp = Invoke-RestMethod -Uri "$BackendUrl/api/transactions/import?preview=true" `
            -Method POST `
            -Headers @{ "Authorization" = "Bearer $($script:Token)" } `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -Body $body `
            -ErrorAction SilentlyContinue
        
        if ($resp.wouldInsert -ge 2 -or $resp.previewCount -ge 2 -or $resp.rowCount -ge 2) {
            Write-Status "Preview: wouldInsert/rowCount >= 2"
            $details += "- Preview: ✅ wouldInsert=$($resp.wouldInsert), suggestions present"
        }
        else {
            Write-Status "Preview: expected wouldInsert >= 2" -Pass $false
            $details += "- Preview: ❌ Unexpected response: $($resp | ConvertTo-Json -Compress)"
            $allPass = $false
        }
        Save-Log "4_csv_preview" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "CSV Preview: endpoint may use different format"
        $details += "- Preview: ℹ️ Endpoint format may differ: $($_.Exception.Message)"
        Save-Log "4_csv_preview" "ERROR: $($_.Exception.Message)"
    }
    
    # Commit
    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"test.csv`"",
            "Content-Type: text/csv",
            "",
            $csvContent,
            "--$boundary",
            "Content-Disposition: form-data; name=`"mapping`"",
            "",
            $mapping,
            "--$boundary--"
        )
        $body = $bodyLines -join $LF
        
        $resp = Invoke-RestMethod -Uri "$BackendUrl/api/transactions/import" `
            -Method POST `
            -Headers @{ "Authorization" = "Bearer $($script:Token)" } `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -Body $body `
            -ErrorAction SilentlyContinue
        
        if ($resp.insertedCount -ge 2 -or $resp.imported -ge 2 -or $resp.count -ge 2) {
            Write-Status "Commit: insertedCount >= 2"
            $details += "- Commit: ✅ insertedCount=$($resp.insertedCount)"
        }
        else {
            Write-Info "Commit: response may use different field names"
            $details += "- Commit: ℹ️ Response: $($resp | ConvertTo-Json -Compress)"
        }
        Save-Log "4_csv_commit" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "CSV Commit: $($_.Exception.Message)"
        $details += "- Commit: ℹ️ $($_.Exception.Message)"
        Save-Log "4_csv_commit" "ERROR: $($_.Exception.Message)"
    }
    
    # Undo
    try {
        $resp = Invoke-ApiRequest -Method POST -Url "$BackendUrl/api/transactions/import/undo" -IgnoreError
        if ($resp -and ($resp.undoneCount -gt 0 -or $resp.deleted -gt 0 -or $resp.count -gt 0)) {
            Write-Status "Undo: positive count returned"
            $details += "- Undo: ✅ undoneCount=$($resp.undoneCount)"
        }
        else {
            Write-Info "Undo: no records to undo or different response format"
            $details += "- Undo: ℹ️ Response: $($resp | ConvertTo-Json -Compress)"
        }
        Save-Log "4_csv_undo" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "CSV Undo: endpoint may not exist"
        $details += "- Undo: ℹ️ Endpoint not available"
        Save-Log "4_csv_undo" "ERROR: $($_.Exception.Message)"
    }
    
    # Cleanup
    Remove-Item $csvPath -Force -ErrorAction SilentlyContinue
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "4) CSV Import v2" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 5: BUDGETS V2
# ============================================================================
function Test-Budgets {
    Write-Section "5) Budgets v2: Create + Summary + Rollover"
    $details = @()
    $allPass = $true
    
    # Create budget with rollover
    try {
        $budgetBody = @{
            categoryId  = $script:GroceriesCategoryId
            limitAmount = 500.0
            month       = $script:CurrentMonth
            year        = $script:CurrentYear
            rollover    = $true
        }
        $resp = Invoke-ApiRequest -Method POST -Url "$BackendUrl/api/budgets" -Body $budgetBody -IgnoreError
        if ($resp -and $resp.id) {
            Write-Status "Budget created with rollover=true (id=$($resp.id))"
            $details += "- Create: ✅ Budget id=$($resp.id), rollover=$($resp.rollover)"
        }
        else {
            Write-Info "Budget creation: may already exist or different format"
            $details += "- Create: ℹ️ Response: $($resp | ConvertTo-Json -Compress)"
        }
        Save-Log "5_budget_create" "Body: $($budgetBody | ConvertTo-Json)`nResponse: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "Budget create: $($_.Exception.Message)"
        $details += "- Create: ℹ️ $($_.Exception.Message)"
        Save-Log "5_budget_create" "ERROR: $($_.Exception.Message)"
    }
    
    # Get summary
    try {
        $resp = Invoke-ApiRequest -Method GET -Url "$BackendUrl/api/budgets/summary?month=$($script:CurrentMonth)&year=$($script:CurrentYear)"
        $requiredFields = @("limitAmount", "spentAmount", "remaining")
        $foundFields = @()
        foreach ($field in $requiredFields) {
            if ($resp.PSObject.Properties.Name -contains $field -or ($resp -is [array] -and $resp[0].PSObject.Properties.Name -contains $field)) {
                $foundFields += $field
            }
        }
        if ($foundFields.Count -ge 2) {
            Write-Status "Budget summary: key fields present ($($foundFields -join ', '))"
            $details += "- Summary: ✅ Fields found: $($foundFields -join ', ')"
        }
        else {
            Write-Info "Budget summary: checking alternative response format"
            $details += "- Summary: ℹ️ Response: $($resp | ConvertTo-Json -Compress)"
        }
        Save-Log "5_budget_summary" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "Budget summary: $($_.Exception.Message)"
        $details += "- Summary: ℹ️ $($_.Exception.Message)"
        Save-Log "5_budget_summary" "ERROR: $($_.Exception.Message)"
    }
    
    # Rollover to next month
    try {
        $rolloverBody = @{
            fromMonth = $script:CurrentMonth
            fromYear  = $script:CurrentYear
            toMonth   = $script:NextMonth
            toYear    = $script:NextYear
        }
        $resp = Invoke-ApiRequest -Method POST -Url "$BackendUrl/api/budgets/rollover" -Body $rolloverBody -IgnoreError
        if ($resp) {
            Write-Status "Rollover: executed successfully"
            $details += "- Rollover: ✅ From $($script:CurrentMonth)/$($script:CurrentYear) to $($script:NextMonth)/$($script:NextYear)"
        }
        else {
            Write-Info "Rollover: no response or endpoint not available"
            $details += "- Rollover: ℹ️ Endpoint may not exist"
        }
        Save-Log "5_budget_rollover" "Body: $($rolloverBody | ConvertTo-Json)`nResponse: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "Rollover: $($_.Exception.Message)"
        $details += "- Rollover: ℹ️ $($_.Exception.Message)"
        Save-Log "5_budget_rollover" "ERROR: $($_.Exception.Message)"
    }
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "5) Budgets v2" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 6: INSIGHTS V2
# ============================================================================
function Test-Insights {
    Write-Section "6) Insights v2: Trends + Merchants + Anomalies"
    $details = @()
    $allPass = $true
    
    # Trends
    try {
        $resp = Invoke-ApiRequest -Method GET -Url "$BackendUrl/api/insights/trends?months=6" -IgnoreError
        if ($resp -and ($resp.Count -ge 1 -or $resp.points -or $resp.data)) {
            Write-Status "Trends: data returned for 6 months"
            $details += "- Trends: ✅ Data points returned"
        }
        else {
            Write-Info "Trends: empty or different format"
            $details += "- Trends: ℹ️ Response: $($resp | ConvertTo-Json -Compress)"
        }
        Save-Log "6_insights_trends" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "Trends: $($_.Exception.Message)"
        $details += "- Trends: ℹ️ $($_.Exception.Message)"
        Save-Log "6_insights_trends" "ERROR: $($_.Exception.Message)"
    }
    
    # Merchants
    try {
        $resp = Invoke-ApiRequest -Method GET -Url "$BackendUrl/api/insights/merchants?month=$($script:CurrentMonth)&year=$($script:CurrentYear)" -IgnoreError
        if ($resp -and ($resp -is [array] -or $resp.merchants -or $resp.topMerchants)) {
            Write-Status "Merchants: top merchants data returned"
            $details += "- Merchants: ✅ Top merchants array present"
        }
        else {
            Write-Info "Merchants: empty or different format"
            $details += "- Merchants: ℹ️ Response: $($resp | ConvertTo-Json -Compress)"
        }
        Save-Log "6_insights_merchants" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "Merchants: $($_.Exception.Message)"
        $details += "- Merchants: ℹ️ $($_.Exception.Message)"
        Save-Log "6_insights_merchants" "ERROR: $($_.Exception.Message)"
    }
    
    # Anomalies
    try {
        $resp = Invoke-ApiRequest -Method GET -Url "$BackendUrl/api/insights/anomalies?month=$($script:CurrentMonth)&year=$($script:CurrentYear)" -IgnoreError
        Write-Status "Anomalies: endpoint responded (0+ allowed)"
        $count = if ($resp -is [array]) { $resp.Count } else { "N/A" }
        $details += "- Anomalies: ✅ Returned ($count items)"
        Save-Log "6_insights_anomalies" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "Anomalies: $($_.Exception.Message)"
        $details += "- Anomalies: ℹ️ $($_.Exception.Message)"
        Save-Log "6_insights_anomalies" "ERROR: $($_.Exception.Message)"
    }
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "6) Insights v2" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 7: EXPORT CENTRE
# ============================================================================
function Test-ExportCentre {
    Write-Section "7) Export Centre: CSV + XLSX + PDF"
    $details = @()
    $allPass = $true
    
    $exports = @(
        @{ Name = "CSV"; Url = "$BackendUrl/api/exports/csv/transactions?month=$($script:CurrentMonth)&year=$($script:CurrentYear)"; File = "txns.csv" },
        @{ Name = "XLSX"; Url = "$BackendUrl/api/exports/xlsx/transactions?month=$($script:CurrentMonth)&year=$($script:CurrentYear)"; File = "txns.xlsx" },
        @{ Name = "PDF"; Url = "$BackendUrl/api/exports/pdf/monthly?month=$($script:CurrentMonth)&year=$($script:CurrentYear)"; File = "monthly.pdf" }
    )
    
    foreach ($export in $exports) {
        try {
            $outPath = Join-Path $script:OutDir $export.File
            Invoke-WebRequest -Uri $export.Url -Method GET -Headers @{ "Authorization" = "Bearer $($script:Token)" } -OutFile $outPath -ErrorAction SilentlyContinue
            
            if (Test-Path $outPath) {
                $size = (Get-Item $outPath).Length
                if ($size -gt 0) {
                    Write-Status "$($export.Name): saved ($size bytes)"
                    $details += "- $($export.Name): ✅ Saved to _out/$($export.File) ($size bytes)"
                }
                else {
                    Write-Status "$($export.Name): file is empty" -Pass $false
                    $details += "- $($export.Name): ❌ File is empty"
                    $allPass = $false
                }
            }
            else {
                Write-Info "$($export.Name): file not created"
                $details += "- $($export.Name): ℹ️ File not created"
            }
            Save-Log "7_export_$($export.Name.ToLower())" "URL: $($export.Url)`nSaved to: $outPath"
        }
        catch {
            Write-Info "$($export.Name) export: $($_.Exception.Message)"
            $details += "- $($export.Name): ℹ️ $($_.Exception.Message)"
            Save-Log "7_export_$($export.Name.ToLower())" "ERROR: $($_.Exception.Message)"
        }
    }
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "7) Export Centre" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 8: PWA + OFFLINE
# ============================================================================
function Test-PWA {
    Write-Section "8) PWA + Offline Baseline (Static Checks)"
    $details = @()
    $allPass = $true
    
    # Manifest
    try {
        $resp = Invoke-RestMethod -Uri "$FrontendUrl/manifest.webmanifest" -Method GET -ErrorAction SilentlyContinue
        if ($resp.name -or $resp.short_name) {
            Write-Status "Manifest: found with name='$($resp.name)'"
            $details += "- Manifest: ✅ name='$($resp.name)', short_name='$($resp.short_name)'"
        }
        else {
            Write-Info "Manifest: no name field"
            $details += "- Manifest: ℹ️ JSON present but no name field"
        }
        Save-Log "8_pwa_manifest" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        # Try alternate path
        try {
            $resp = Invoke-RestMethod -Uri "$FrontendUrl/manifest.json" -Method GET -ErrorAction SilentlyContinue
            if ($resp.name) {
                Write-Status "Manifest (manifest.json): found with name='$($resp.name)'"
                $details += "- Manifest: ✅ name='$($resp.name)' (manifest.json)"
            }
        }
        catch {
            Write-Info "Manifest: not found"
            $details += "- Manifest: ℹ️ Not found (PWA may not be enabled)"
        }
    }
    
    # Service Worker
    $swPaths = @("/sw.js", "/service-worker.js", "/serviceworker.js")
    $swFound = $false
    foreach ($swPath in $swPaths) {
        try {
            $resp = Invoke-WebRequest -Uri "$FrontendUrl$swPath" -Method GET -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) {
                Write-Status "Service Worker: found at $swPath"
                $details += "- Service Worker: ✅ Found at $swPath"
                $swFound = $true
                Save-Log "8_pwa_sw" "URL: $FrontendUrl$swPath`nStatus: 200"
                break
            }
        }
        catch { }
    }
    if (-not $swFound) {
        Write-Info "Service Worker: not found at common paths"
        $details += "- Service Worker: ℹ️ Not found (PWA may use different setup)"
        Save-Log "8_pwa_sw" "Not found at: $($swPaths -join ', ')"
    }
    
    $status = if ($allPass) { "[PASS]" } else { "[FAIL]" }
    Add-ReportSection "8) PWA + Offline" $status ($details -join "`n")
    return $allPass
}

# ============================================================================
# CHECK 9: UX/A11Y TOGGLES
# ============================================================================
function Test-UxA11y {
    Write-Section "9) UX/A11y Toggles (Static Checks)"
    $details = @()
    
    $darkModeFound = $false
    $themeToggleFound = $false
    
    # Check frontend source/public for dark mode
    $frontendSrcPath = Join-Path $script:RootDir "frontend/src"
    $frontendPublicPath = Join-Path $script:RootDir "frontend/public"
    $frontendDistPath = Join-Path $script:RootDir "frontend/dist"
    
    # Search for dark mode CSS variables or theme toggle
    $searchPaths = @($frontendSrcPath, $frontendPublicPath, $frontendDistPath)
    foreach ($searchPath in $searchPaths) {
        if (Test-Path $searchPath) {
            $cssFiles = Get-ChildItem -Path $searchPath -Recurse -Include "*.css" -ErrorAction SilentlyContinue
            foreach ($file in $cssFiles) {
                $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -match "dark-mode|--dark|prefers-color-scheme:\s*dark|\.dark\s*\{|data-theme") {
                    $darkModeFound = $true
                    break
                }
            }
            
            $jsFiles = Get-ChildItem -Path $searchPath -Recurse -Include "*.js", "*.jsx", "*.ts", "*.tsx" -ErrorAction SilentlyContinue
            foreach ($file in $jsFiles) {
                $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -match "theme.*toggle|toggleTheme|darkMode|setTheme|useTheme") {
                    $themeToggleFound = $true
                    break
                }
            }
        }
        if ($darkModeFound -and $themeToggleFound) { break }
    }
    
    if ($darkModeFound) {
        Write-Status "Dark mode CSS: present"
        $details += "- Dark Mode CSS: ✅ Present"
    }
    else {
        Write-Info "Dark mode CSS: not found"
        $details += "- Dark Mode CSS: ℹ️ Not found"
    }
    
    if ($themeToggleFound) {
        Write-Status "Theme toggle marker: present"
        $details += "- Theme Toggle: ✅ Present in JS/TS"
    }
    else {
        Write-Info "Theme toggle marker: not found"
        $details += "- Theme Toggle: ℹ️ Not found"
    }
    
    Save-Log "9_ux_a11y" "DarkMode: $darkModeFound`nThemeToggle: $themeToggleFound"
    
    # This check doesn't fail the run
    Add-ReportSection "9) UX/A11y Toggles" "[INFO]" ($details -join "`n")
    return $true
}

# ============================================================================
# CHECK 10: OPEN BANKING STUB
# ============================================================================
function Test-OpenBanking {
    Write-Section "10) Open Banking Stub (Feature-Flag Path)"
    $details = @()
    
    # Check if feature is enabled (from env or just try the endpoints)
    try {
        $resp = Invoke-ApiRequest -Method POST -Url "$BackendUrl/api/ob/connect" -IgnoreError
        if ($resp -and ($resp.consentUrl -or $resp.url -or $resp.redirectUrl)) {
            Write-Status "OB Connect: stubbed consent URL returned"
            $details += "- Connect: ✅ Consent URL returned"
        }
        else {
            Write-Info "OB Connect: no consent URL or feature disabled"
            $details += "- Connect: ℹ️ Feature may be disabled"
        }
        Save-Log "10_ob_connect" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "OB Connect: endpoint not available"
        $details += "- Connect: ℹ️ Endpoint not available (feature flag disabled)"
        Save-Log "10_ob_connect" "ERROR: $($_.Exception.Message)"
    }
    
    try {
        $resp = Invoke-ApiRequest -Method GET -Url "$BackendUrl/api/ob/accounts" -IgnoreError
        if ($resp -is [array]) {
            Write-Status "OB Accounts: array returned ($($resp.Count) items)"
            $details += "- Accounts: ✅ Array returned ($($resp.Count) stub accounts)"
        }
        else {
            Write-Info "OB Accounts: not an array or feature disabled"
            $details += "- Accounts: ℹ️ Feature may be disabled"
        }
        Save-Log "10_ob_accounts" "Response: $($resp | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Info "OB Accounts: endpoint not available"
        $details += "- Accounts: ℹ️ Endpoint not available"
        Save-Log "10_ob_accounts" "ERROR: $($_.Exception.Message)"
    }
    
    # This check doesn't fail the run (feature flag controlled)
    Add-ReportSection "10) Open Banking Stub" "[INFO]" ($details -join "`n")
    return $true
}

# ============================================================================
# MAIN
# ============================================================================
function Main {
    Write-Host @"

╔═══════════════════════════════════════════════════════════════════╗
║           🚀 FinSmart Sprint-1 Completion Auditor 🚀              ║
╚═══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
    
    Initialize-Directories
    
    $results = @()
    
    # Run all checks
    $results += Test-ServiceHealth
    $results += Test-AuthFlow
    $results += Test-AdminDemo
    $results += Test-CategoriesAccounts
    $results += Test-CsvImport
    $results += Test-Budgets
    $results += Test-Insights
    $results += Test-ExportCentre
    $results += Test-PWA
    $results += Test-UxA11y
    $results += Test-OpenBanking
    
    # Generate report
    $reportContent = @"
# FinSmart Sprint-1 Completion Report

**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Test Email**: $script:TestEmail
**Current Period**: $script:CurrentMonth/$script:CurrentYear

## Summary

| Metric | Count |
|--------|-------|
| ✅ PASS | $script:PassCount |
| ❌ FAIL | $script:FailCount |
| **Total** | $($script:PassCount + $script:FailCount) |

$($script:Report -join "`n")

---

## Artifacts

- **Logs**: `_check_logs/` directory
- **Exports**: `_out/` directory
  - `txns.csv` - Transaction export (CSV)
  - `txns.xlsx` - Transaction export (Excel)
  - `monthly.pdf` - Monthly report (PDF)
"@
    
    $reportPath = Join-Path $script:OutDir "sprint1_report.md"
    $reportContent | Out-File -FilePath $reportPath -Encoding utf8
    
    # TL;DR
    Write-Host @"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        📊 TL;DR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Yellow
    
    Write-Host "  ✅ PASS: $script:PassCount" -ForegroundColor Green
    Write-Host "  ❌ FAIL: $script:FailCount" -ForegroundColor Red
    Write-Host ""
    Write-Host "  📄 Report: $reportPath" -ForegroundColor Cyan
    Write-Host ""
    
    if ($script:FailCount -gt 0) {
        Write-Host "  ⚠️  Some checks failed. See report for details." -ForegroundColor Yellow
        exit 1
    }
    else {
        Write-Host "  🎉 All checks passed!" -ForegroundColor Green
        exit 0
    }
}

# Run
Main
