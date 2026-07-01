@echo off
setlocal

cd /d "%~dp0frontend"

echo Starting frontend at http://127.0.0.1:5173
npm.cmd run dev -- --host 127.0.0.1 --port 5173

endlocal
