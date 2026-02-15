@echo off
REM Wrapper to run the PowerShell script with an execution policy bypass so double-click works
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restart-servers.ps1"

