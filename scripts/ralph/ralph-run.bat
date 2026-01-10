@echo off
REM Ralph Wiggum - Run Iterations
REM Double-click to start Ralph iteration loop

cd /d "%~dp0"

echo ========================================
echo Ralph Wiggum - Run Iterations
echo ========================================
echo.

REM Check for prd.json
if not exist "prd.json" (
    echo ERROR: No prd.json found
    echo.
    echo Please create a PRD first:
    echo   1. Copy prd.json.example to prd.json
    echo   2. Edit prd.json with your feature requirements
    echo   3. Run this file again
    echo.
    pause
    exit /b 1
)

REM Check if bash is available
where bash >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git Bash not found in PATH
    echo Please install Git for Windows: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Starting Ralph...
echo.

bash ralph.sh run

pause
