@echo off
echo StudyMate Backend - Quick Start (API Gateway only)
echo ====================================================

cd /d "%~dp0\.."

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [!] Virtual environment not found - creating...
    python -m venv venv
    echo [OK] Virtual environment created.
)

echo [OK] Activating virtual environment...
call venv\Scripts\activate

echo [..] Installing/updating required packages...
python -m pip install --upgrade pip --quiet 2>nul
python -m pip install -r requirements.txt --quiet 2>nul

echo.
echo Starting API Gateway on http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo   Health:    http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server
echo ====================================================

cd api-gateway
python main.py

pause
