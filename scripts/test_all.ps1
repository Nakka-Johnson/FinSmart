#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Run all tests in the FinSmart monorepo
.DESCRIPTION
    Executes test suites for:
    - Backend: Maven Surefire (unit + integration tests)
    - Frontend: (placeholder - not implemented yet)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$ExitCode = 0

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  FinSmart Test Runner" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Backend Tests
# ============================================================================
Write-Host "[Backend] Running Maven tests..." -ForegroundColor Yellow
Push-Location "$RootDir\backend"
try {
    & .\mvnw.cmd -q test -DskipITs=false
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Backend] TESTS FAILED" -ForegroundColor Red
        $ExitCode = 1
    }
    else {
        Write-Host "[Backend] OK - All tests passed" -ForegroundColor Green
    }
}
catch {
    Write-Host "[Backend] ERROR: $_" -ForegroundColor Red
    $ExitCode = 1
}
finally {
    Pop-Location
}

Write-Host ""

# ============================================================================
# Frontend Tests
# ============================================================================
Write-Host "[Frontend] Checking for tests..." -ForegroundColor Yellow
Push-Location "$RootDir\frontend"
try {
    if (Test-Path "package.json") {
        $pkg = Get-Content "package.json" | ConvertFrom-Json
        if ($pkg.scripts.PSObject.Properties.Name -contains "test") {
            Write-Host "[Frontend] Running tests..." -ForegroundColor Yellow
            & npm test
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[Frontend] TESTS FAILED" -ForegroundColor Red
                $ExitCode = 1
            }
            else {
                Write-Host "[Frontend] OK - All tests passed" -ForegroundColor Green
            }
        }
        else {
            Write-Host "[Frontend] WARNING - No test script configured in package.json" -ForegroundColor Yellow
            Write-Host "[Frontend] SKIPPED" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "[Frontend] ERROR: $_" -ForegroundColor Red
    $ExitCode = 1
}
finally {
    Pop-Location
}

Write-Host ""

# ============================================================================
# Summary
# ============================================================================
if ($ExitCode -eq 0) {
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host "  All tests passed!" -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
}
else {
    Write-Host "=============================================================" -ForegroundColor Red
    Write-Host "  Tests failed - see errors above" -ForegroundColor Red
    Write-Host "=============================================================" -ForegroundColor Red
}

Write-Host ""
exit $ExitCode
