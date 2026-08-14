@echo off
title Vibecraft - Dev Runner
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Vibecraft - Dev Runner (single window)
echo   Game   : http://localhost:8080
echo   Assets : http://localhost:4300
echo   Capital: http://localhost:4310
echo   Q quits  |  R restarts the game server
echo   Every log line is saved to dev-runner.log
echo ============================================
echo.
echo Single CLI rule: only ONE of these windows may exist.
echo If another instance is already active, running this again
echo will UPDATE it (reload) instead of opening a second CLI.
echo.

node dev.mjs
