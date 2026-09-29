@echo off
cd /d "%~dp0web"
echo [MangoVision] Starting Web Dashboard on http://localhost:3000 ...
npm run dev
pause
