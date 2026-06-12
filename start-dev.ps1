# start-dev.ps1
# PowerShell script to build and start both the backend and frontend apps for SlashPad.

$root = $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "SlashPad: Starting Backend and Frontend..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Locate Maven
$mvnPath = "C:\Program Files\JetBrains\IntelliJ IDEA 2025.3\plugins\maven\lib\maven3\bin\mvn.cmd"
if (-not (Test-Path $mvnPath)) {
    $mvnPath = "mvn"
}

# Start Backend (Spring Boot)
Write-Host "[1/2] Starting Spring Boot Backend (Port 8080)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "& '$mvnPath' spring-boot:run" -WorkingDirectory "$root\notepad-backend"

# Wait a brief moment for the backend port to start opening
Start-Sleep -Seconds 3

# Start Frontend (Angular)
Write-Host "[2/2] Starting Angular Frontend (Port 4200)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm start" -WorkingDirectory "$root\notepad-frontend"

Write-Host "==================================================" -ForegroundColor Green
Write-Host "Startup commands initiated in the background!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8080" -ForegroundColor Green
Write-Host "Frontend: http://localhost:4200" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
