@echo off
REM JARVIS Complete Startup Script
REM This script starts both the telemetry server and JARVIS application

echo.
echo ========================================
echo  J.A.R.V.I.S. - Complete System Boot
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo ✓ Python dependencies installed

echo.
echo [2/3] Installing Node.js dependencies and building...
call npm install
if errorlevel 1 (
    echo WARNING: npm install had issues, continuing anyway...
)
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✓ TypeScript build successful

echo.
echo [3/3] Starting JARVIS systems...
echo.
echo Starting Telemetry Server on http://localhost:8000
start "JARVIS Telemetry Server" python bridge.py

echo Waiting 2 seconds for telemetry server to start...
timeout /t 2 /nobreak

echo Starting JARVIS Application...
echo.
start "JARVIS" cmd /k "npm start"

echo.
echo ========================================
echo  J.A.R.V.I.S. Systems Initializing...
echo ========================================
echo.
echo Telemetry Server: http://localhost:8000
echo Waiting for JARVIS UI to load...
echo.
timeout /t 3 /nobreak

echo All systems should now be online.
echo Check the JARVIS window for status.
echo.
pause
