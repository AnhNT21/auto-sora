@echo off
REM Change to your project directory
cd /d "C:\Users\ADMIN\Desktop\A1\auto-sora\"

echo Pulling latest changes...
git pull

echo Installing dependencies...
npm install

echo Starting app...
start "" cmd /c "npm start"

REM Wait a bit for the server to boot (adjust as needed)
timeout /t 5 /nobreak >nul

echo Sending request to http://localhost:3000/auto ...
curl http://localhost:3000/auto

pause
