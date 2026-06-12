@echo off
echo ==================================================
echo SlashPad: Starting Backend and Frontend...
echo ==================================================

set ROOT=%~dp0

:: Find Maven
set MVN_PATH="C:\Program Files\JetBrains\IntelliJ IDEA 2025.3\plugins\maven\lib\maven3\bin\mvn.cmd"
if not exist %MVN_PATH% (
    set MVN_PATH=mvn
)

:: Start Backend (Spring Boot)
echo [1/2] Starting Spring Boot Backend (Port 8080)...
start /B cmd /c "cd /d "%ROOT%notepad-backend" && %MVN_PATH% spring-boot:run"

:: Wait a moment
timeout /t 3 /nobreak >nul

:: Start Frontend (Angular)
echo [2/2] Starting Angular Frontend (Port 4200)...
start /B cmd /c "cd /d "%ROOT%notepad-frontend" && npm start"

echo ==================================================
echo Startup commands initiated in the background!
echo Backend: http://localhost:8080
echo Frontend: http://localhost:4200
echo ==================================================
