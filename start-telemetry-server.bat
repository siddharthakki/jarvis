@echo off
REM Start only the JARVIS Telemetry Server
REM Run this in a separate window/terminal

echo.
echo ====================================
echo  JARVIS Telemetry Server
echo ====================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed
    echo Install from https://www.python.org/
    pause
    exit /b 1
)

echo Installing/updating Python dependencies...
pip install -q fastapi uvicorn psutil GPUtil

echo.
echo Starting Telemetry Server on http://localhost:8000
echo Press Ctrl+C to stop
echo.

python bridge.py
