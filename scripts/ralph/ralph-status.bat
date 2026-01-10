@echo off
REM Ralph Wiggum - Check Status
REM Double-click to see current progress

cd /d "%~dp0"

REM Check if bash is available
where bash >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git Bash not found in PATH
    echo Please install Git for Windows: https://git-scm.com/download/win
    pause
    exit /b 1
)

bash ralph.sh status

pause
