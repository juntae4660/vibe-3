@echo off
setlocal

cd /d "%~dp0"

echo Starting backend and frontend in separate windows...
start "Admin Super App Backend" cmd /k "%~dp0run_backend.bat"
start "Admin Super App Frontend" cmd /k "%~dp0run_frontend.bat"

echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173

endlocal
