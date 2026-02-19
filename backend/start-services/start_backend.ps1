#!/usr/bin/env powershell
# StudyMate Backend Launcher (PowerShell)

Write-Host "StudyMate Backend - Quick Start (API Gateway only)" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location (Join-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) "..")

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "[!] Virtual environment not found - creating..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "[OK] Virtual environment created." -ForegroundColor Green
}

Write-Host "[OK] Activating virtual environment..." -ForegroundColor Blue
try {
    & ".\venv\Scripts\Activate.ps1"
    Write-Host "[OK] Virtual environment activated!" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Failed to activate virtual environment!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[..] Installing/updating required packages..." -ForegroundColor Blue
python -m pip install --upgrade pip -q 2>$null
python -m pip install -r requirements.txt -q 2>$null

Write-Host "[OK] Packages installed!" -ForegroundColor Green
Write-Host ""

Write-Host "Starting API Gateway on http://localhost:8000" -ForegroundColor Green
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Health:    http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

# Start the API Gateway
Set-Location api-gateway
python main.py

Read-Host "Press Enter to exit"
