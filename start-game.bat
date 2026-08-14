@echo off
title Vibecraft - Dev Runner (single window)
cd /d "%~dp0"

echo ============================================
echo   Vibecraft - Dev Runner
echo   Game   : http://localhost:8080
echo   Assets : http://localhost:4300
echo   Ctrl+C stops everything.
echo ============================================
echo.
echo WARNING: if this window shows "instancia ja esta rodando",
echo another AI/terminal already started the server. Do NOT
echo start another one - find and kill it instead.
echo.

node dev.mjs
