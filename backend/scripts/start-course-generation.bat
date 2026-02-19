@echo off
echo Starting Course Generation Service...

cd "%~dp0\..\agents\course-generation"

python main.py

pause
