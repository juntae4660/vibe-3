@echo off
setlocal

cd /d "%~dp0"

set "CLOUDFLARED_EXE=%~dp0tools\cloudflared.exe"

if not exist "%CLOUDFLARED_EXE%" (
  echo cloudflared.exe not found. Downloading the latest Windows binary...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; New-Item -ItemType Directory -Force -Path 'tools' | Out-Null; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'tools\cloudflared.exe'"
  if errorlevel 1 (
    echo Failed to download cloudflared.
    exit /b 1
  )
)

echo Starting Cloudflare Tunnel for http://127.0.0.1:8000
echo Copy the public URL printed below into the frontend connection field.
"%CLOUDFLARED_EXE%" tunnel --url http://127.0.0.1:8000

endlocal
