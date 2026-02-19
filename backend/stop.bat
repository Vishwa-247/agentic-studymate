@echo off
echo ======================================================
echo   StudyMate Backend - Stop All Services
echo ======================================================

cd /d "%~dp0"

echo [..] Stopping services by window title...
taskkill /F /FI "WINDOWTITLE eq API Gateway*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Interview Coach*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Resume Analyzer*" 2>nul
taskkill /F /FI "WINDOWTITLE eq DSA Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Profile Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Course Generation*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Project Studio*" 2>nul

echo.
echo [..] Cleaning up processes on backend ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8002') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8003') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8004') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8006') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8008') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8012') do taskkill /F /PID %%a 2>nul

echo.
echo [OK] All StudyMate backend services stopped!
echo.
echo To verify:  netstat -ano ^| findstr ":800"
echo To restart: start.bat
echo ======================================================
pause
