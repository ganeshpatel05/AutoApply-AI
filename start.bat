@echo off
title AutoApply AI - All-in-One Launcher
echo ===================================================
echo   AutoApply AI - Complete Local Environment Starter
echo ===================================================
echo.

cd /d "%~dp0"

:: 1. Check and create .env configuration
if not exist .env (
    echo [SETUP 1/4] Creating .env file from .env.example...
    if exist .env.example (
        copy .env.example .env >nul
        echo          .env file created successfully!
    ) else (
        echo OLLAMA_MODEL=mistral > .env
        echo OLLAMA_BASE_URL=http://localhost:11434 >> .env
        echo          Default .env file created!
    )
)

:: 2. Check and create required directories
if not exist "database" mkdir database
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

:: 3. Check Python Virtual Environment & install requirements if needed
if not exist "venv\Scripts\python.exe" (
    echo [SETUP 2/4] Virtual environment (venv) not found. Creating venv...
    python -m venv venv
    echo          Installing Python backend dependencies...
    venv\Scripts\python -m pip install -r requirements.txt
)

:: 4. Check Frontend dependencies & run npm install if needed
if not exist "frontend\node_modules" (
    echo [SETUP 3/4] Frontend node_modules not found. Running npm install...
    cd frontend
    call npm install
    cd ..
)

:: 5. Check and Start Ollama AI Engine (Port 11434)
echo.
echo [1/3] Checking Ollama AI Engine (Port 11434)...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo       [INFO] Ollama binary not found in PATH.
    echo              System will use intelligent template fallback for cover letters.
) else (
    curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
    if %errorlevel% equ 0 (
        echo       Ollama server is already running!
    ) else (
        echo       Starting Ollama server in a new window...
        start "Ollama AI Engine" cmd /k "ollama serve"
        echo       Waiting for Ollama to initialize...
        timeout /t 3 >nul
    )
    echo       Ensuring mistral model is downloaded...
    start "Ollama Model Downloader" /min cmd /c "ollama pull mistral"
)

:: 6. Start Backend API (Port 8000)
echo.
echo [2/3] Starting Backend API (Port 8000)...
start "AutoApply Backend API" /d "%~dp0" cmd /k "venv\Scripts\python api\main.py"

:: 7. Start Frontend UI (Port 5173)
echo.
echo [3/3] Starting Frontend UI (Port 5173)...
start "AutoApply Frontend UI" /d "%~dp0frontend" cmd /k "npm run dev"

:: 8. Launch Browser
echo.
echo Launching AutoApply AI Dashboard in browser...
timeout /t 4 >nul
start http://localhost:5173

echo.
echo ===================================================
echo   All services launched successfully!
echo ===================================================
echo   - Ollama AI Engine : http://localhost:11434
echo   - Backend API      : http://localhost:8000
echo   - Frontend UI      : http://localhost:5173
echo ===================================================
echo.
pause


