@echo off
title Vibecraft - Game Server
cd /d "%~dp0"

echo ============================================
echo   Vibecraft - Startup
echo   Game: http://localhost:8080
echo   Assets: http://localhost:4300
echo ============================================
echo.

echo [1/2] Starting game server (detached)...
node run-server.js
echo       Game server PID above. Logs: server-run.log / server-run.err.log
echo.

echo [2/2] Starting asset browser (detached)...
start "" /min cmd /c "node tools\asset-browser\server.mjs > assets-browser.log 2>&1"
echo       Asset browser running on http://localhost:4300
echo.

echo Opening game in browser...
timeout /t 2 /nobreak >nul
start "" http://localhost:8080

echo.
echo Done. Servers running in background.
echo To stop: close the node processes (or reboot).
pause
