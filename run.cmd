@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem === Disable Quick Edit/Insert for THIS console window only ===
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$sig='using System; using System.Runtime.InteropServices; public static class K{ [DllImport(\"kernel32.dll\")] public static extern System.IntPtr GetStdHandle(int nStdHandle); [DllImport(\"kernel32.dll\")] public static extern bool GetConsoleMode(System.IntPtr h, out uint m); [DllImport(\"kernel32.dll\")] public static extern bool SetConsoleMode(System.IntPtr h, uint m);}';" ^
  "Add-Type -TypeDefinition $sig -IgnoreWarnings | Out-Null;" ^
  "$h=[K]::GetStdHandle(-10); [uint32]$m=0; [K]::GetConsoleMode($h,[ref]$m) | Out-Null;" ^
  "$m = ($m -bor 0x80) -band (-bnot 0x40) -band (-bnot 0x20);" ^
  "[K]::SetConsoleMode($h,$m) | Out-Null" ^
  || echo (Quick Edit toggle skipped)

rem =========================
rem [0/5] Repo status & remote updates
rem =========================
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

git fetch --all --prune --tags --quiet

set "WT_CHANGED=0"
for /f %%c in ('git status --porcelain -uno ^| find /v /c ""') do set "WT_COUNT=%%c"
if not "%WT_COUNT%"=="0" set "WT_CHANGED=1"

set "AHEAD=0"
set "BEHIND=0"
for /f %%a in ('git rev-list --count @{u}..HEAD 2^>nul') do set "AHEAD=%%a"
for /f %%b in ('git rev-list --count HEAD..@{u} 2^>nul') do set "BEHIND=%%b"

if "%WT_CHANGED%"=="1" (
  echo   - Working tree: changes detected
) else (
  echo   - Working tree: clean
)
echo   - Commits ahead of remote: %AHEAD%
echo   - Commits behind remote: %BEHIND%

if not "%BEHIND%"=="0" (
  echo [1/5] Remote updates found on %UPSTREAM%. Pulling...
  git pull --ff-only || (
    echo Pull failed. Resolve conflicts and rerun.
    goto :fail
  )
  echo.
  echo ============================
  echo Updates were pulled successfully.
  echo Please CLOSE this window and RUN the script again to apply changes.
  echo ============================
  goto :eof
)

echo [1/5] Repo up to date.

rem =========================
rem [2/5] Install deps if needed
rem =========================
for /f "tokens=*" %%i in ('git --no-pager status -s 2^>nul') do set "DUMMY=%%i"
if defined DUMMY (
  echo [2/5] Installing deps...
  set "DUMMY="
  call npm install --no-fund --no-audit --silent || goto :fail
  cls
  echo Dependencies installed.
) else (
  echo [2/5] Skipping npm install (no changes).
)

rem =========================
rem [3/5] Start server (same console, Quick Edit disabled)
rem =========================
echo [3/5] Starting server...
rem Use START /B to avoid a new window (so Quick Edit setting applies).
start "" /B cmd /c "npm start"
rem small delay to let Node boot before the health checks
timeout /t 1 /nobreak >nul

rem =========================
rem [4/5] Wait for server
rem =========================
echo [4/5] Waiting for http://localhost:3000 ...
for /L %%I in (1,1,120) do (
  >nul 2>&1 powershell -NoProfile -Command "try{ (Invoke-WebRequest -UseBasicParsing http://localhost:3000/ -TimeoutSec 1) | Out-Null; exit 0 } catch { exit 1 }"
  if not errorlevel 1 goto :ready
  timeout /t 1 /nobreak >nul
)
echo Server did not become ready within 120s.
goto :fail

:ready
rem =========================
rem [5/5] Trigger automation endpoint
rem =========================
echo [5/5] Hitting automation endpoint...
curl -sS http://localhost:3000/auto || goto :fail

echo.
echo Done. Press Ctrl+C to stop the app.
goto :eof

:fail
echo.
echo ERROR. Please resolve the issues and try again.
pause
