#!/usr/bin/env pwsh
# Production deployment script for FinSmart
# Usage: .\deploy-prod.ps1 [build|start|stop|restart|logs|status]

param(
    [Parameter(Position=0)]
    [ValidateSet('build', 'start', 'stop', 'restart', 'logs', 'status', 'health', 'help')]
    [string]$Command = 'help'
)

$ComposeFile = "docker-compose.prod.yml"
$EnvFile = ".env.production"

function Show-Help {
    Write-Host @"

FinSmart Production Deployment Script
======================================

Usage: .\deploy-prod.ps1 [command]

Commands:
  build     Build all Docker images
  start     Start all services (detached)
  stop      Stop all services
  restart   Restart all services
  logs      Show logs (follow mode)
  status    Show service status
  health    Check health of all services
  help      Show this help message

Examples:
  .\deploy-prod.ps1 build
  .\deploy-prod.ps1 start
  .\deploy-prod.ps1 logs
  .\deploy-prod.ps1 health

Prerequisites:
  1. Create $EnvFile from .env.production.example
  2. Update caddy/Caddyfile with your domain
  3. Ensure Docker Desktop is running

"@ -ForegroundColor Cyan
}

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow

    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Docker found" -ForegroundColor Green

    # Check Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Docker Compose found" -ForegroundColor Green

    # Check .env.production
    if (-not (Test-Path $EnvFile)) {
        Write-Host "❌ $EnvFile not found" -ForegroundColor Red
        Write-Host "   Copy .env.production.example to $EnvFile and configure it" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ $EnvFile found" -ForegroundColor Green

    # Check for default values in .env.production
    $envContent = Get-Content $EnvFile -Raw
    if ($envContent -match "CHANGE_ME" -or $envContent -match "your-domain.com") {
        Write-Host "⚠️  Warning: $EnvFile contains default values" -ForegroundColor Yellow
        Write-Host "   Please update with your actual configuration" -ForegroundColor Yellow
    }

    Write-Host ""
}

function Build-Images {
    Write-Host "Building Docker images..." -ForegroundColor Cyan
    Test-Prerequisites
    docker compose -f $ComposeFile build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Build completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
}

function Start-Services {
    Write-Host "Starting services..." -ForegroundColor Cyan
    Test-Prerequisites
    docker compose -f $ComposeFile up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services started" -ForegroundColor Green
        Write-Host ""
        Start-Sleep -Seconds 5
        Get-Status
    } else {
        Write-Host "❌ Failed to start services" -ForegroundColor Red
        exit 1
    }
}

function Stop-Services {
    Write-Host "Stopping services..." -ForegroundColor Cyan
    docker compose -f $ComposeFile down
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services stopped" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to stop services" -ForegroundColor Red
        exit 1
    }
}

function Restart-Services {
    Write-Host "Restarting services..." -ForegroundColor Cyan
    docker compose -f $ComposeFile restart
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services restarted" -ForegroundColor Green
        Start-Sleep -Seconds 5
        Get-Status
    } else {
        Write-Host "❌ Failed to restart services" -ForegroundColor Red
        exit 1
    }
}

function Show-Logs {
    Write-Host "Showing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
    docker compose -f $ComposeFile logs -f
}

function Get-Status {
    Write-Host "Service Status:" -ForegroundColor Cyan
    Write-Host ""
    docker compose -f $ComposeFile ps
    Write-Host ""
}

function Test-Health {
    Write-Host "Checking service health..." -ForegroundColor Cyan
    Write-Host ""

    $services = @{
        "Frontend" = "http://localhost:80/health"
        "Backend API" = "http://localhost:8080/api/health"
        "AI Service" = "http://localhost:8001/health"
        "Caddy (HTTP)" = "http://localhost:80/api/health"
    }

    foreach ($service in $services.GetEnumerator()) {
        Write-Host "$($service.Key): " -NoNewline
        try {
            $response = Invoke-WebRequest -Uri $service.Value -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ Healthy" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Unhealthy" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "For detailed logs, run: .\deploy-prod.ps1 logs" -ForegroundColor Cyan
}

# Main execution
switch ($Command) {
    'build' { Build-Images }
    'start' { Start-Services }
    'stop' { Stop-Services }
    'restart' { Restart-Services }
    'logs' { Show-Logs }
    'status' { Get-Status }
    'health' { Test-Health }
    'help' { Show-Help }
    default { Show-Help }
}
