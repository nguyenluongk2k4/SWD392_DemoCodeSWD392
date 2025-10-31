@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Root directory of the project
set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%
set CLIENT_DIR=%ROOT_DIR%client

REM Ensure backend dependencies are installed
if not exist "%BACKEND_DIR%node_modules" (
    echo Installing backend dependencies...
    pushd "%BACKEND_DIR%"
    call npm install
    popd
)

REM Ensure client dependencies are installed
if not exist "%CLIENT_DIR%\node_modules" (
    echo Installing client dependencies...
    pushd "%CLIENT_DIR%"
    call npm install
    popd
)

REM Start backend server
echo Starting backend server...
start "SmartAgri API" cmd /k "cd /d %BACKEND_DIR% && npm run start"

REM Start React client
echo Starting React client...
start "SmartAgri Client" cmd /k "cd /d %CLIENT_DIR% && npm start"

echo.
echo Backend and client have been launched in separate windows.
echo Close those windows to stop the services.
endlocal
