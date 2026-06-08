@echo off
setlocal

set "ROOT=%~dp0"
set "DASHBOARD_URL=http://localhost:4545"

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%DASHBOARD_URL%' -UseBasicParsing -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }"

if errorlevel 1 (
  start "MyTools Dashboard Server" /min cmd /k "cd /d "%ROOT%tools-dashboard" && npm start"
  timeout /t 2 /nobreak >nul
)

start "" "%DASHBOARD_URL%"

endlocal
