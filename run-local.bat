@echo off
setlocal ENABLEDELAYEDEXPANSION

echo ===============================================
echo  Smart Agriculture System - Local Setup
echo ===============================================
echo.

REM Kill processes on port 3000 and 3001
echo [1/4] Checking and killing processes on ports 3000 and 3001...

REM Kill port 3000 (Backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3000...
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill port 3001 (Frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3001...
    taskkill /F /PID %%a >nul 2>&1
)

echo [DONE] Ports cleared.
echo.

REM Root directory of the project
set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%
set CLIENT_DIR=%ROOT_DIR%client

REM Ensure backend dependencies are installed
echo [2/4] Checking backend dependencies...
if not exist "%BACKEND_DIR%node_modules" (
    echo Installing backend dependencies...
    pushd "%BACKEND_DIR%"
    call npm install
    popd
) else (
    echo Backend dependencies already installed.
)
echo.

REM Ensure client dependencies are installed
echo [3/4] Checking client dependencies...
if not exist "%CLIENT_DIR%\node_modules" (
    echo Installing client dependencies...
    pushd "%CLIENT_DIR%"
    call npm install
    popd
) else (
    echo Client dependencies already installed.
)
echo.

REM Start backend server
echo [4/4] Starting services...
echo Starting backend server on port 3000...
start "SmartAgri API - Port 3000" cmd /k "cd /d %BACKEND_DIR% && npm start"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start React client
echo Starting React client on port 3001...
start "SmartAgri Client - Port 3001" cmd /k "cd /d %CLIENT_DIR% && set BROWSER=none && npm start"

echo.
echo ===============================================
echo  Services Started Successfully!
echo ===============================================
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:3001
echo ===============================================
echo.
echo Close the separate windows to stop the services.
echo Press any key to exit this window...
pause >nul
endlocal
