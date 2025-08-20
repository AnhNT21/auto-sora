@echo off

@REM REM Start npm in a new process
@REM start "" cmd /c "npm start"

@REM REM Wait a few seconds for the server to start
@REM timeout /t 5 >nul

REM Send GET request to localhost:3000/auto
curl http://localhost:3000/browser

pause
