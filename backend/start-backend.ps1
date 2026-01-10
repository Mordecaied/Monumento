# Start Monumento Backend Server
# Run this in PowerShell: .\start-backend.ps1

Write-Host "🚀 Starting Monumento Backend..." -ForegroundColor Cyan

# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"

# Navigate to backend directory
Set-Location $PSScriptRoot

# Check if backend is already running
$existingProcess = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Port 8080 is already in use. Backend may already be running." -ForegroundColor Yellow
    Write-Host "To stop it, press Ctrl+C in the terminal where it's running, or run:" -ForegroundColor Yellow
    Write-Host "  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force" -ForegroundColor Yellow
    exit 1
}

# Start the backend
Write-Host "📦 Starting Spring Boot application..." -ForegroundColor Green
.\mvnw.cmd spring-boot:run

Write-Host "`n✅ Backend stopped." -ForegroundColor Green
