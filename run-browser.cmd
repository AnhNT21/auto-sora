@echo off
cd /d C:\Users\ADMIN\Desktop\A1\auto-sora\

REM Start npm in a new process
start "" cmd /c "npm start"

REM Wait a few seconds for the server to start
timeout /t 5 >nul

REM Send GET request to localhost:3000/auto
curl http://localhost:3000/browser

pause
