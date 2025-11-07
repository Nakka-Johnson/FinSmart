#Requires -Version 7.2

<#
.SYNOPSIS
    Phase 3 Smoke Test - FinSmart Auth + Core APIs
.DESCRIPTION
    Idempotent smoke test that validates:
    - Health checks (Backend + AI)
    - Authentication (Register/Login/Me)
    - Categories CRUD
    - Accounts CRUD
    - Transactions CRUD + Listing
    - Budgets + Summary
.EXAMPLE
    powershell -File .\scripts\phase3_smoke.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================================
# Configuration
# ============================================================================
$Base = "http://localhost:8081"
$AI   = "http://127.0.0.1:8001"

$TestUser = @{
    email    = "john@example.com"
    password = "SuperSecret123!"
    fullName = "John Doe"
}

# ============================================================================
# Helper Functions
# ============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host "[>>] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    try {
        $params = @{
            Method      = $Method
            Uri         = $Uri
            Headers     = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 5 -Compress)
        }
        
        return Invoke-RestMethod @params
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        $endpoint = $Uri -replace "^https?://[^/]+", ""
        
        Write-Fail "Request failed: $Method $endpoint (HTTP $status)"
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        
        throw "HTTP $status at $endpoint"
    }
}

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )
    
    if (-not $Condition) {
        Write-Fail $Message
        throw $Message
    }
}

function Assert-NotEmpty {
    param(
        [object]$Value,
        [string]$Name
    )
    
    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Fail "$Name is empty or null"
        throw "$Name must not be empty"
    }
}

# ============================================================================
# Test Execution
# ============================================================================

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host "  FinSmart Phase 3 Smoke Test" -ForegroundColor Magenta
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host ""

# ----------------------------------------------------------------------------
# 1) Health Checks
# ----------------------------------------------------------------------------
Write-Step "Step 1: Health Checks"

try {
    $health = Invoke-RestMethod -Uri "$Base/api/health" -Method Get
    Assert-True ($health -like "*FinSmart*running*") "Backend health check failed"
    Write-Ok "Backend health: OK"
}
catch {
    Write-Fail "Backend is not running on $Base"
    throw
}

try {
    $aiHealth = Invoke-Json -Method Get -Uri "$AI/health"
    Assert-True ($aiHealth.status -eq "ai ok") "AI service health check failed"
    Write-Ok "AI service health: OK"
}
catch {
    Write-Fail "AI service is not running on $AI"
    throw
}

Write-Host ""

# ----------------------------------------------------------------------------
# 2) Authentication
# ----------------------------------------------------------------------------
Write-Step "Step 2: Authentication"

# Try to register (idempotent - ignore 409)
try {
    $regResp = Invoke-Json -Method Post -Uri "$Base/api/auth/register" -Body $TestUser
    Write-Ok "User registered successfully"
}
catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "  [i] User already exists (continuing)" -ForegroundColor Yellow
    }
    else {
        throw
    }
}

# Login
$loginReq = @{
    email    = $TestUser.email
    password = $TestUser.password
}

$loginResp = Invoke-Json -Method Post -Uri "$Base/api/auth/login" -Body $loginReq
$Token = $loginResp.token
Assert-NotEmpty $Token "JWT Token"
Write-Ok "Login successful (token acquired)"

# Verify /me endpoint
$authHeaders = @{ Authorization = "Bearer $Token" }
$me = Invoke-Json -Method Get -Uri "$Base/api/auth/me" -Headers $authHeaders
Assert-True ($me.email -eq $TestUser.email) "User email mismatch"
Write-Ok "Token validation: OK (user=$($me.email))"

Write-Host ""

# ----------------------------------------------------------------------------
# 3) Categories
# ----------------------------------------------------------------------------
Write-Step "Step 3: Categories"

$categories = Invoke-Json -Method Get -Uri "$Base/api/categories" -Headers $authHeaders
Write-Ok "Categories list: $($categories.Count) found"

$groceriesCategory = $categories | Where-Object { $_.name -eq "Groceries" } | Select-Object -First 1

if (-not $groceriesCategory) {
    Write-Host "  [i] Creating 'Groceries' category..." -ForegroundColor Yellow
    
    try {
        $newCat = @{
            name  = "Groceries"
            color = "#22AA66"
        }
        $groceriesCategory = Invoke-Json -Method Post -Uri "$Base/api/categories" -Body $newCat -Headers $authHeaders
        Write-Ok "Category 'Groceries' created"
    }
    catch {
        if ($_.Exception.Message -like "*409*") {
            # Race condition - fetch again
            $categories = Invoke-Json -Method Get -Uri "$Base/api/categories" -Headers $authHeaders
            $groceriesCategory = $categories | Where-Object { $_.name -eq "Groceries" } | Select-Object -First 1
        }
        else {
            throw
        }
    }
}

$GroceriesId = $groceriesCategory.id
Assert-NotEmpty $GroceriesId "Groceries category ID"
Write-Ok "Groceries category: $GroceriesId"

Write-Host ""

# ----------------------------------------------------------------------------
# 4) Accounts
# ----------------------------------------------------------------------------
Write-Step "Step 4: Accounts"

$accountReq = @{
    name        = "Monzo Current"
    institution = "Monzo"
    type        = "CHECKING"
    currency    = "GBP"
}

$account = $null
try {
    $account = Invoke-Json -Method Post -Uri "$Base/api/accounts" -Body $accountReq -Headers $authHeaders
    Write-Ok "Account 'Monzo Current' created"
}
catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "  [i] Account already exists, fetching..." -ForegroundColor Yellow
        $accounts = Invoke-Json -Method Get -Uri "$Base/api/accounts" -Headers $authHeaders
        $account = $accounts | Where-Object { $_.name -eq "Monzo Current" } | Select-Object -First 1
    }
    else {
        throw
    }
}

$AccountId = $account.id
Assert-NotEmpty $AccountId "Account ID"
Write-Ok "Account ID: $AccountId (balance: GBP$($account.balance))"

Write-Host ""

# ----------------------------------------------------------------------------
# 5) Transactions (2 samples)
# ----------------------------------------------------------------------------
Write-Step "Step 5: Transactions"

# DEBIT transaction
$debitTx = @{
    accountId   = $AccountId
    postedAt    = "2025-11-01T12:00:00Z"
    amount      = 45.20
    direction   = "DEBIT"
    description = "Tesco"
    categoryId  = $GroceriesId
}

$tx1 = Invoke-Json -Method Post -Uri "$Base/api/transactions" -Body $debitTx -Headers $authHeaders
Assert-NotEmpty $tx1.id "Transaction 1 ID"
Write-Ok "Transaction 1 (DEBIT): GBP$($tx1.amount) - $($tx1.description)"

# CREDIT transaction
$creditTx = @{
    accountId   = $AccountId
    postedAt    = "2025-11-02T09:00:00Z"
    amount      = 1200.00
    direction   = "CREDIT"
    description = "Salary"
}

$tx2 = Invoke-Json -Method Post -Uri "$Base/api/transactions" -Body $creditTx -Headers $authHeaders
Assert-NotEmpty $tx2.id "Transaction 2 ID"
Write-Ok "Transaction 2 (CREDIT): GBP$($tx2.amount) - $($tx2.description)"

Write-Host ""

# ----------------------------------------------------------------------------
# 6) Transactions List (paged)
# ----------------------------------------------------------------------------
Write-Step "Step 6: Transactions List (Paginated)"

$txListUri = "$Base/api/transactions?accountId=$AccountId`&page=0`&size=10`&sort=postedAt,DESC"
$txList = Invoke-Json -Method Get -Uri $txListUri -Headers $authHeaders

Assert-True ($txList.content.Count -ge 2) "Expected at least 2 transactions in list"
Write-Ok "Transactions list: $($txList.content.Count) items (page $($txList.page + 1)/$($txList.totalPages))"

$totalAmount = ($txList.content | Measure-Object -Property amount -Sum).Sum
Write-Host "  [*] Total amount in list: GBP $totalAmount" -ForegroundColor White

Write-Host ""

# ----------------------------------------------------------------------------
# 7) Budgets + Summary
# ----------------------------------------------------------------------------
Write-Step "Step 7: Budgets + Summary"

$Month = [int](Get-Date).ToString("MM")
$Year = [int](Get-Date).ToString("yyyy")

$budgetReq = @{
    categoryId  = $GroceriesId
    month       = $Month
    year        = $Year
    limitAmount = 200.00
}

try {
    $budget = Invoke-Json -Method Post -Uri "$Base/api/budgets" -Body $budgetReq -Headers $authHeaders
    Write-Ok "Budget created for Groceries ($Month/$Year): GBP $($budget.limitAmount)"
}
catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "  [i] Budget already exists (continuing)" -ForegroundColor Yellow
    }
    else {
        throw
    }
}

# Get budget summary
$summaryUri = "$Base/api/budgets/summary?month=$Month`&year=$Year"
$summary = Invoke-Json -Method Get -Uri $summaryUri -Headers $authHeaders

$groceriesBudget = $summary | Where-Object { $_.categoryName -eq "Groceries" } | Select-Object -First 1
Assert-True ($null -ne $groceriesBudget) "Groceries budget not found in summary"
Assert-True ($groceriesBudget.spentAmount -ge 0) "Invalid spent amount"

Write-Ok "Budget summary retrieved"
$percentText = "$($groceriesBudget.percentUsed)%"
Write-Host "  [*] Groceries: Spent GBP $($groceriesBudget.spentAmount) / GBP $($groceriesBudget.limitAmount) ($percentText)" -ForegroundColor White

Write-Host ""

# ============================================================================
# Final Summary
# ============================================================================

Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host "  [OK] Phase 3 Smoke Test: ALL PASSED" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  [*] User: $($me.fullName) ($($me.email))" -ForegroundColor White
Write-Host "  [*] Category: Groceries ($GroceriesId)" -ForegroundColor White
Write-Host "  [*] Account: Monzo Current ($AccountId) - Balance: GBP $($account.balance)" -ForegroundColor White
Write-Host "  [*] Transactions: $($txList.content.Count) found (total: GBP $totalAmount)" -ForegroundColor White
$summaryPercent = "$($groceriesBudget.percentUsed)%"
Write-Host "  [*] Budget: Spent GBP $($groceriesBudget.spentAmount) / GBP $($groceriesBudget.limitAmount) ($summaryPercent)" -ForegroundColor White
Write-Host ""
Write-Host "SUCCESS - All core APIs are operational!" -ForegroundColor Green
Write-Host ""

exit 0
