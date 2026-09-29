@echo off
echo ==============================================
echo   🌿 Starting MangoVision System (Full Stack)
echo ==============================================
echo [1/2] Launching Backend on http://localhost:8000 ...
start "MangoVision Backend" "%~dp0run_backend.bat"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo [2/2] Launching Web Dashboard on http://localhost:3000 ...
start "MangoVision Frontend" "%~dp0run_web.bat"

echo.
echo All services launched!
echo - Web Dashboard:  http://localhost:3000
echo - Swagger Docs:   http://localhost:8000/docs
echo - Login:          admin@mangovision.com / password123
echo.
