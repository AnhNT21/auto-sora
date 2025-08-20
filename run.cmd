@echo off
setlocal EnableExtensions DisableDelayedExpansion

REM === Disable Quick Edit/Insert for THIS console window only ===
powershell -NoProfile -ExecutionPolicy Bypass -Command "$sig='using System; using System.Runtime.InteropServices; public static class K{ [DllImport(\"kernel32.dll\")] public static extern System.IntPtr GetStdHandle(int nStdHandle); [DllImport(\"kernel32.dll\")] public static extern bool GetConsoleMode(System.IntPtr h, out uint m); [DllImport(\"kernel32.dll\")] public static extern bool SetConsoleMode(System.IntPtr h, uint m);}'; Add-Type -TypeDefinition $sig -IgnoreWarnings | Out-Null; $h=[K]::GetStdHandle(-10); [uint32]$m=0; [K]::GetConsoleMode($h,[ref]$m) | Out-Null; $m = ($m -bor 0x80) -band (-bnot 0x40) -band (-bnot 0x20); [K]::SetConsoleMode($h,$m) | Out-Null" || echo ^(Quick Edit toggle skipped^)

REM =========================
REM [0/5] Reset repo to remote
REM =========================
echo [0/5] Checking for updates...

git rev-parse --is-inside-work-tree >nul 2>&1 || (
  echo Not a git repository. Aborting.
  goto :fail
)

set "BRANCH="
for /f "usebackq delims=" %%b in (`git rev-parse --abbrev-ref HEAD 2^>nul`) do set "BRANCH=%%b"

set "UPSTREAM="
for /f "usebackq delims=" %%u in (`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2^>nul`) do set "UPSTREAM=%%u"

if not defined UPSTREAM (
  for /f "usebackq delims=" %%t in (`git ls-remote --heads origin %BRANCH% 2^>nul`) do set "HAS_REMOTE_HEAD=1"
  if defined HAS_REMOTE_HEAD (
    git branch --set-upstream-to=origin/%BRANCH% >nul 2>&1
    for /f "usebackq delims=" %%u in (`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2^>nul`) do set "UPSTREAM=%%u"
  )
)

if not defined UPSTREAM (
  echo No upstream tracking branch found for "%BRANCH%".
  echo You can set it with: git branch --set-upstream-to=origin/%BRANCH%
  goto :fail
)

echo   - Fetching latest remote state...
git fetch --all --prune --tags --quiet

echo   - Discarding all local changes and aligning with %UPSTREAM%...
git reset --hard %UPSTREAM%
git clean -fd

echo [1/5] Repo reset complete.

REM =========================
REM [2/5] Install deps if needed
REM =========================
set "NEED_NPM=0"
git diff --name-only -- package.json package-lock.json npm-shrinkwrap.json 2>nul | findstr /r /c:"^" >nul && set "NEED_NPM=1"

if "%NEED_NPM%"=="1" goto :install_deps
echo [2/5] Skipping npm install.
goto :after_npm

:install_deps
echo [2/5] Installing deps...
call npm install --no-fund --no-audit --silent || goto :fail
cls
echo Dependencies installed.

:after_npm

REM =========================
REM [3/5] Start server (same console, Quick Edit disabled)
REM =========================
echo [3/5] Starting server...
start "" /B cmd /c "npm start"
timeout /t 1 /nobreak >nul

REM =========================
REM [4/5] Wait for server
REM =========================
echo [4/5] Waiting for http://127.0.0.1:3000 ...
for /L %%I in (1,1,120) do (
  curl --silent --fail --max-time 2 http://127.0.0.1:3000/ >nul 2>&1 && goto :ready
  timeout /t 1 /nobreak >nul
)
echo Server did not become ready within 120s.
goto :fail

:ready
REM =========================
REM [5/5] Trigger automation endpoint
REM =========================
echo [5/5] Hitting automation endpoint...
curl -sS http://localhost:3000/auto || goto :fail

echo.
echo Done. Press Ctrl+C to stop the app.
goto :eof

:_pingHttp
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing %~1 -TimeoutSec 1 ^| Out-Null; exit 0 } catch { exit 1 }"
exit /b %errorlevel%

:fail
echo.
echo ERROR. Please resolve the issues and try again.
pause
