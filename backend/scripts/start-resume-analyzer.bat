@echo off
echo ======================================================
echo   StudyMate - Resume Analyzer Service (Port 8003)
echo ======================================================

REM Resolve backend directory (this script is in backend\scripts)
cd /d "%~dp0\.."
set BACKEND_DIR=%CD%
set SERVICE_DIR=%BACKEND_DIR%\agents\resume-analyzer

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist "%BACKEND_DIR%\.env" (
    echo [FAIL] .env file not found at %BACKEND_DIR%\.env
    echo Please create one based on .env.example
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "%BACKEND_DIR%\venv\Scripts\activate.bat" (
    echo [..] Virtual environment not found - creating...
    python -m venv "%BACKEND_DIR%\venv"
    echo [OK] Virtual environment created.
)

REM Activate virtual environment
echo [OK] Activating virtual environment...
call "%BACKEND_DIR%\venv\Scripts\activate.bat"

REM Install requirements quietly
echo [..] Checking dependencies...
python -m pip install -r "%BACKEND_DIR%\requirements.txt" --quiet 2>nul

REM Check if port 8003 is already in use
netstat -ano | findstr :8003 >nul
if not errorlevel 1 (
    echo [!] Port 8003 is in use. Killing existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8003') do taskkill /F /PID %%a 2>nul
    timeout /t 2 /nobreak >nul
)

REM Change to service directory
cd /d "%SERVICE_DIR%"

echo.
echo [OK] Starting Resume Analyzer on port 8003...
echo   API:     http://localhost:8003
echo   Docs:    http://localhost:8003/docs
echo   Health:  http://localhost:8003/health
echo.
echo   Press Ctrl+C to stop
echo ======================================================

python main.py
pause