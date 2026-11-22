@echo off
cd /d "%~dp0"
if not exist "backend\.venv\Scripts\python.exe" (
  echo Please run npm run setup:backend first.
  pause
  exit /b 1
)
"backend\.venv\Scripts\python.exe" "scripts\start_public_demo.py"
pause
