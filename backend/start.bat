@echo off
echo ======================================================
echo   StudyMate Backend - Consolidated Launcher
echo   (6 services + evaluator/orchestrator/job-search
echo    embedded in the API Gateway)
echo ======================================================

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [!] Virtual environment not found - creating...
    python -m venv venv
    echo [OK] Virtual environment created.
)

REM Check if .env exists
if not exist ".env" (
    echo [FAIL] .env file not found!
    echo Please copy .env.example to .env and configure it
    pause
    exit /b 1
)

echo [OK] Activating virtual environment...
call venv\Scripts\activate

echo [..] Installing/updating dependencies...
python -m pip install --upgrade pip --quiet 2>nul
python -m pip install -r requirements.txt --quiet 2>nul

echo.
echo [OK] Starting services...
echo.

REM 1. API Gateway (port 8000) — also hosts evaluator, orchestrator, job-search
start "API Gateway - Port 8000" cmd /k "cd /d %~dp0 && venv\Scripts\activate && cd api-gateway && python main.py"
timeout /t 3 /nobreak >nul

REM 2. Interview Coach (port 8002)
start "Interview Coach - Port 8002" cmd /k "cd /d %~dp0 && venv\Scripts\activate && cd agents\interview-coach && python main.py"
timeout /t 3 /nobreak >nul

REM 3. Resume Analyzer (port 8003)
start "Resume Analyzer - Port 8003" cmd /k "cd /d %~dp0 && venv\Scripts\activate && cd agents\resume-analyzer && python main.py"
timeout /t 2 /nobreak >nul

REM 4. DSA Service (port 8004)
start "DSA Service - Port 8004" cmd /k "cd /d %~dp0 && venv\Scripts\activate && cd agents\dsa-service && python main.py"
timeout /t 2 /nobreak >nul

REM 5. Profile Service (port 8006)
start "Profile Service - Port 8006" cmd /k "cd /d %~dp0 && venv\Scripts\activate && cd agents\profile-service && python main.py"
timeout /t 2 /nobreak >nul

REM 6. Course Generation (port 8008)
start "Course Generation - Port 8008" cmd /k "cd /d %~dp0 && venv\Scripts\activate && cd agents\course-generation && python main.py"
timeout /t 2 /nobreak >nul

REM 7. Project Studio (port 8012)
start "Project Studio - Port 8012" cmd /k "cd /d %~dp0 && venv\Scripts\activate && cd agents\project-studio && python main.py"
timeout /t 2 /nobreak >nul

echo.
echo ======================================================
echo   All services started!
echo.
echo   Proxied services:
echo     API Gateway:       http://localhost:8000  (+ evaluator, orchestrator, job-search)
echo     Interview Coach:   http://localhost:8002
echo     Resume Analyzer:   http://localhost:8003
echo     DSA Service:       http://localhost:8004
echo     Profile Service:   http://localhost:8006
echo     Course Generation: http://localhost:8008
echo     Project Studio:    http://localhost:8012
echo.
echo   API Docs:   http://localhost:8000/docs
echo   Health:     http://localhost:8000/health
echo.
echo   Stop all:   stop.bat
echo ======================================================
pause
