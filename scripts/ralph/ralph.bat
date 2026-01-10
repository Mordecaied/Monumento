@echo off
REM Ralph Wiggum - Windows Batch Launcher
REM Double-click this file to run Ralph

cd /d "%~dp0"

REM Check if bash is available (Git Bash)
where bash >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git Bash not found in PATH
    echo.
    echo Please install Git for Windows: https://git-scm.com/download/win
    echo Or add Git Bash to your PATH
    pause
    exit /b 1
)

REM Run Ralph with bash
bash ralph.sh %*

pause
