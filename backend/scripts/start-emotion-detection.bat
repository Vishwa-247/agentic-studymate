@echo off
echo Starting Emotion Detection Service...
REM Move to backend root
cd /d "%~dp0\.."

REM Activate venv
if not exist "venv\Scripts\activate.bat" (
  echo ❌ Virtual environment not found. Please run scripts\setup\setup.bat
  pause
  exit /b 1
)
call venv\Scripts\activate

REM Upgrade pip quietly and ensure CPU PyTorch is installed
python -m pip install --upgrade pip -q
python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q
python -m pip install opencv-python numpy scipy -q

REM Launch service
cd agents\emotion-detection
python main.py
pause
