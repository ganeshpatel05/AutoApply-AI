@echo off
echo ==============================================
echo   AutoApply AI - Local Environment Starter
echo ==============================================
echo.

echo [1/2] Starting Backend API (Port 8000)...
start cmd /k "venv\Scripts\python api\main.py"

echo [2/2] Starting Frontend UI (Port 5173)...
cd frontend
start cmd /k "npm run dev"

echo.
echo Both servers have been started in new windows!
echo Once they load, you can access the UI at http://localhost:5173
echo.
pause
