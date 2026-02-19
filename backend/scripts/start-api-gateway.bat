@echo off
echo 🚀 Starting StudyMate API Gateway...
echo ==================================

REM Get the directory of this script
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%..
set SERVICE_DIR=%BACKEND_DIR%\api-gateway

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "%BACKEND_DIR%\venv" (
    echo ⚠️  Virtual environment not found. Creating one...
    cd /d "%BACKEND_DIR%"
    python -m venv venv
    echo ✅ Virtual environment created.
)

REM Activate virtual environment
echo 📦 Activating virtual environment...
call "%BACKEND_DIR%\venv\Scripts\activate.bat"

REM Install requirements if needed
echo 📥 Installing dependencies...
pip install -r "%BACKEND_DIR%\requirements.txt"

REM Check if .env file exists
if not exist "%BACKEND_DIR%\.env" (
    echo ⚠️  .env file not found. Please create one based on .env.example
    if exist "%BACKEND_DIR%\.env.example" (
        echo 💡 You can copy .env.example to .env and edit it:
        echo    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env"
    )
    pause
    exit /b 1
)

REM Change to service directory
cd /d "%SERVICE_DIR%"

REM Check if port is available (simplified check for Windows)
netstat -ano | findstr :8000 >nul
if not errorlevel 1 (
    echo ⚠️  Port 8000 appears to be in use. You may need to stop the existing service.
)

echo 🏃 Starting API Gateway on port 8000...
echo 📋 Service will be available at: http://localhost:8000
echo 📖 API Documentation: http://localhost:8000/docs
echo ❤️  Health Check: http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the service
echo ==================================

REM Start the service
python main.py
pause