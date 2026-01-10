@echo off
REM Ralph Wiggum - PRD Setup Helper
REM Double-click to create a new PRD

cd /d "%~dp0"

echo ========================================
echo Ralph Wiggum - PRD Setup
echo ========================================
echo.

REM Check if prd.json already exists
if exist "prd.json" (
    echo WARNING: prd.json already exists!
    echo.
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 (
        echo.
        echo Cancelled. Your existing prd.json is safe.
        pause
        exit /b 0
    )
    echo.
)

echo Available PRD templates:
echo.
echo 1. Blank template (prd.json.example)
echo 2. Session Tags example (prd-session-tags.json)
echo 3. Cancel
echo.

choice /C 123 /N /M "Select template (1, 2, or 3): "

if errorlevel 3 (
    echo.
    echo Cancelled.
    pause
    exit /b 0
)

if errorlevel 2 (
    copy /Y prd-session-tags.json prd.json >nul
    echo.
    echo Created prd.json from Session Tags example
    echo.
    echo Next steps:
    echo   1. Edit prd.json to customize for your feature
    echo   2. Double-click ralph-run.bat to start
    echo.
    pause
    exit /b 0
)

if errorlevel 1 (
    copy /Y prd.json.example prd.json >nul
    echo.
    echo Created prd.json from blank template
    echo.
    echo Next steps:
    echo   1. Edit prd.json with your feature requirements
    echo   2. Double-click ralph-run.bat to start
    echo.
    pause
    exit /b 0
)
