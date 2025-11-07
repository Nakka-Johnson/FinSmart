#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Format all code in the FinSmart monorepo
.DESCRIPTION
    Runs code formatters for:
    - Backend: Maven Spotless (Java)
    - Frontend: Prettier + ESLint (TS/JS)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$ExitCode = 0

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  FinSmart Code Formatter" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Backend (Maven Spotless)
# ============================================================================
Write-Host "[Backend] Running Spotless..." -ForegroundColor Yellow
Push-Location "$RootDir\backend"
try {
    & .\mvnw.cmd -q spotless:apply
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Backend] FAILED" -ForegroundColor Red
        $ExitCode = 1
    }
    else {
        Write-Host "[Backend] OK - Java files formatted" -ForegroundColor Green
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
# Frontend (Prettier + ESLint)
# ============================================================================
Write-Host "[Frontend] Running Prettier + ESLint..." -ForegroundColor Yellow
Push-Location "$RootDir\frontend"
try {
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "[Frontend] Installing dependencies first..." -ForegroundColor Yellow
        & npm install
    }

    # Format
    & npm run format
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Frontend] Format FAILED" -ForegroundColor Red
        $ExitCode = 1
    }

    # Lint
    & npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Frontend] Lint FAILED" -ForegroundColor Red
        $ExitCode = 1
    }

    if ($ExitCode -eq 0) {
        Write-Host "[Frontend] OK - TS/JS files formatted and linted" -ForegroundColor Green
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
    Write-Host "  All code formatted successfully!" -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
}
else {
    Write-Host "=============================================================" -ForegroundColor Red
    Write-Host "  Formatting failed - see errors above" -ForegroundColor Red
    Write-Host "=============================================================" -ForegroundColor Red
}

Write-Host ""
exit $ExitCode
