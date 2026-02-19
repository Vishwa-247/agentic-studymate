@echo off
echo 🔧 StudyMate Backend Setup
echo ==========================

cd /d "%~dp0\..\.."

REM Create virtual environment if not exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install all dependencies
echo Installing all dependencies...
pip install -r requirements.txt

REM Create .env from example if not exists
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo ⚠️  Please edit backend\.env and add your API keys!
)

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Edit backend\.env and add your API keys
echo 2. Run: scripts\start\start-all.bat
echo.
pause
