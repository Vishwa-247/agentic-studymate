@echo off
echo 🚀 Starting All StudyMate Backend Services
echo ==========================================

cd /d "%~dp0\..\.."

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo Please run: scripts\setup\setup.bat
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate

REM Check if .env exists
if not exist ".env" (
    echo ❌ .env file not found!
    echo Please copy .env.example to .env and configure it
    pause
    exit /b 1
)

echo ✅ Starting services...
echo.

REM Ensure pip is up to date and PyTorch CPU is installed for emotion service
echo 🔧 Ensuring pip and PyTorch (CPU) are installed...
python -m pip install --upgrade pip -q
REM Install CPU-only PyTorch wheels from official index to avoid CUDA downloads
python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q
REM In case opencv/numpy/scipy are missing for emotion service, ensure they exist
python -m pip install opencv-python numpy scipy -q

REM Start each service in a new window
start "API Gateway" cmd /k "cd /d %~dp0\..\..\api-gateway && ..\venv\Scripts\activate && python main.py"
timeout /t 2 /nobreak >nul

start "Profile Service" cmd /k "cd /d %~dp0\..\..\agents\profile-service && ..\..\venv\Scripts\activate && python main.py"
timeout /t 2 /nobreak >nul

start "Resume Analyzer" cmd /k "cd /d %~dp0\..\..\agents\resume-analyzer && ..\..\venv\Scripts\activate && python main.py"
timeout /t 2 /nobreak >nul

start "Course Generation" cmd /k "cd /d %~dp0\..\..\agents\course-generation && ..\..\venv\Scripts\activate && python main.py"
timeout /t 2 /nobreak >nul

start "Interview Coach" cmd /k "cd /d %~dp0\..\..\agents\interview-coach && ..\..\venv\Scripts\activate && python main.py"
timeout /t 2 /nobreak >nul

start "Emotion Detection" cmd /k "cd /d %~dp0\..\..\agents\emotion-detection && ..\..\venv\Scripts\activate && python main.py"
timeout /t 2 /nobreak >nul

echo.
echo ✅ All services started!
echo.
echo 📖 Service URLs:
echo    - API Gateway: http://localhost:8000
echo    - Profile Service: http://localhost:8006
echo    - Resume Analyzer: http://localhost:8003
echo    - Course Generation: http://localhost:8008
echo    - Interview Coach: http://localhost:8002
echo    - Emotion Detection: http://localhost:5000
echo.
echo 📖 API Documentation: http://localhost:8000/docs
echo.
pause
