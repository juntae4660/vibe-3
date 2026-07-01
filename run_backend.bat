@echo off
setlocal

cd /d "%~dp0backend"
set "UV_CACHE_DIR=.uv-cache"

echo Starting backend at http://127.0.0.1:8000
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

endlocal
