@echo off
title DataInsight Platform - Dual Launcher
echo ========================================================
echo   Starting DataInsight - BCU MSc AI Analytics Platform
echo ========================================================
echo.

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "DataInsight Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Next.js Frontend on http://localhost:3000 ...
start "DataInsight Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  Both services launched in separate windows!
echo  - Frontend Web UI:  http://localhost:3000
echo  - Backend API Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause

