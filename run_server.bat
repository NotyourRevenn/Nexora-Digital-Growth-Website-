@echo off
title Nexora Digital Full-Stack Engine
cd /d "%~dp0"

echo =========================================================================
echo   NEXORA DIGITAL - AGENCY ENGINE ^& ADMIN PORTAL
echo =========================================================================
echo.
echo Starting Python Web Server...
echo   - Public Website: http://localhost:5000/
echo   - Admin Portal:   http://localhost:5000/admin
echo   - Default Login:  admin / nexora2026!
echo.
echo Press Ctrl+C at any time to stop the server.
echo =========================================================================
echo.

python server.py
if %errorlevel% neq 0 (
    echo.
    echo Trying fallback Python launcher...
    py -3 server.py
)

pause
