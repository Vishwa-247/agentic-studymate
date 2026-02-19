@echo off
echo 🛑 Stopping All StudyMate Services
echo ==================================

taskkill /F /FI "WINDOWTITLE eq API Gateway*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Profile Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Resume Analyzer*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Course Generation*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Interview Coach*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Emotion Detection*" 2>nul

echo ✅ All services stopped!
pause
