@echo off
REM JARVIS Telemetry System Verification
REM Checks if all dependencies and configurations are correct

echo.
echo ========================================
echo  JARVIS Telemetry System Verification
echo ========================================
echo.

setlocal enabledelayedexpansion
set ERRORS=0

REM Check Python
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo   ✗ Python NOT FOUND - Install from https://www.python.org/
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VER=%%i
    echo   ✓ Python found: !PYTHON_VER!
)

REM Check Node.js
echo [2/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo   ✗ Node.js NOT FOUND - Install from https://nodejs.org/
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo   ✓ Node.js found: !NODE_VER!
)

REM Check requirements.txt
echo [3/5] Checking requirements.txt...
if not exist requirements.txt (
    echo   ✗ requirements.txt NOT FOUND
    set /a ERRORS+=1
) else (
    echo   ✓ requirements.txt found
    echo   Contains:
    for /f "tokens=*" %%i in (requirements.txt) do echo     - %%i
)

REM Check bridge.py
echo [4/5] Checking bridge.py telemetry server...
if not exist bridge.py (
    echo   ✗ bridge.py NOT FOUND
    set /a ERRORS+=1
) else (
    echo   ✓ bridge.py found
    findstr /c:"GPU" bridge.py >nul
    if errorlevel 1 (
        echo   ! GPU support not detected
    ) else (
        echo   ✓ GPU support included
    )
)

REM Check HTML telemetry code
echo [5/5] Checking JARVIS UI telemetry integration...
if not exist "src\ui\index.html" (
    echo   ✗ src\ui\index.html NOT FOUND
    set /a ERRORS+=1
) else (
    echo   ✓ src\ui\index.html found
    findstr /c:"localhost:8000" "src\ui\index.html" >nul
    if errorlevel 1 (
        echo   ✗ Telemetry endpoint not found in HTML
        set /a ERRORS+=1
    ) else (
        echo   ✓ Telemetry WebSocket configured
    )
    
    findstr /c:"gpu-panel" "src\ui\index.html" >nul
    if errorlevel 1 (
        echo   ✗ GPU panel not found in HTML
    ) else (
        echo   ✓ GPU display panel included
    )
)

echo.
echo ========================================
if %ERRORS% equ 0 (
    echo  ✓ ALL CHECKS PASSED
    echo.
    echo  Ready to start JARVIS:
    echo.
    echo  Option 1: Automatic
    echo    start-jarvis-complete.bat
    echo.
    echo  Option 2: Manual
    echo    1. Terminal 1: python bridge.py
    echo    2. Terminal 2: npm run build ^&^& npm start
    echo.
) else (
    echo  ✗ %ERRORS% ERRORS FOUND
    echo.
    echo  Please fix the issues above and run this
    echo  verification script again.
    echo.
)
echo ========================================
echo.

pause
