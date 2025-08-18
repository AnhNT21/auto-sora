@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem === Disable Quick Edit just for this window ===
powershell -NoProfile -ExecutionPolicy Bypass -Command "$sig='using System; using System.Runtime.InteropServices; public static class K{ [DllImport(\"kernel32.dll\")] public static extern System.IntPtr GetStdHandle(int nStdHandle); [DllImport(\"kernel32.dll\")] public static extern bool GetConsoleMode(System.IntPtr h, out uint m); [DllImport(\"kernel32.dll\")] public static extern bool SetConsoleMode(System.IntPtr h, uint m);}'; Add-Type -TypeDefinition $sig -IgnoreWarnings | Out-Null; $h=[K]::GetStdHandle(-10); [uint32]$m=0; [K]::GetConsoleMode($h,[ref]$m) | Out-Null; $m = ($m -bor 0x80) -band (-bnot 0x40) -band (-bnot 0x20); [K]::SetConsoleMode($h,$m) | Out-Null" || echo (Quick Edit toggle skipped)

rem =========================
rem [0/5] Sync with remote (force if local changed)
rem =========================
echo [0/5] Inspecting git status...

rem Ensure we're in a git repo
git rev-parse --is-inside-work-tree >nul 2>&1 || (
  echo Not a git repository. Aborting.
  goto :fail
)

rem Find current branch and its upstream (like origin/main)
set "BRANCH="
for /f "usebackq delims=" %%b in (`git rev-parse --abbrev-ref HEAD 2^>nul`) do set "BRANCH=%%b"

set "UPSTREAM="
for /f "usebackq delims=" %%u in (`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2^>nul`) do set "UPSTREAM=%%u"

if not defined UPSTREAM (
  rem Try to set upstream to origin/<branch> if it exists
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

rem Fetch latest remote refs
git fetch --all --prune --tags --quiet

rem Check for working tree changes (staged/unstaged) and untracked files
set "WT_CHANGED=0"
for /f %%c in ('git status --porcelain -uno ^| find /v /c ""') do set "WT_COUNT=%%c"
if not "%WT_COUNT%"=="0" set "WT_CHANGED=1"

rem Check if we are ahead/behind upstream (local commits or remote commits)
set "AHEAD=0"
set "BEHIND=0"
for /f %%a in ('git rev-list --count @{u}..HEAD 2^>nul') do set "AHEAD=%%a"
for /f %%b in ('git rev-list --count HEAD..@{u} 2^>nul') do set "BEHIND=%%b"

if "%WT_CHANGED%"=="1"  (
  echo   - Working tree: changes detected
) else (
  echo   - Working tree: clean
)
echo   - Commits ahead of remote: %AHEAD%
echo   - Commits behind remote: %BEHIND%

rem If anything local differs (changes or ahead commits), force replace by remote
if "%WT_CHANGED%"=="1"  goto :force_replace
if not "%AHEAD%"=="0"   goto :force_replace

goto :pull_latest

:force_replace
echo [0/5] Local changes/commits detected -> forcing replacement from "%UPSTREAM%"...
rem Discard uncommitted changes and untracked files/dirs
git reset --hard >nul 2>&1
git clean -fd >nul 2>&1
rem Reset exactly to remote tip
git reset --hard "%UPSTREAM%" >nul 2>&1
if errorlevel 1 (
  echo Failed to reset to %UPSTREAM%.
  goto :fail
)
echo   - Workspace now matches %UPSTREAM%.

:pull_latest
echo [1/5] Checking for updates...
set "UPTODATE="
set "CHANGED="
for /f "tokens=*" %%i in ('git --no-pager pull 2^>^&1') do (
  set "line=%%i"
  echo !line!
  echo !line! | find /I "Already up to date." >nul && set "UPTODATE=1"
  echo !line! | find /I "Fast-forward"        >nul && set "CHANGED=1"
  echo !line! | find /I "Updating "           >nul && set "CHANGED=1"
  echo !line! | find /I "files changed"       >nul && set "CHANGED=1"
)

if defined UPTODATE (
  echo [2/5] Repo up to date — skip npm install.
) else (
  echo [2/5] Installing deps...
  call npm install --no-fund --no-audit --silent || goto :fail
  cls
  echo Dependencies installed.
)

echo [3/5] Starting server...
start /B "" cmd /c "npm start"
timeout /t 1 /nobreak >nul

echo [4/5] Waiting for http://localhost:3000 ...
for /L %%I in (1,1,120) do (
  >nul 2>&1 powershell -NoProfile -Command "try{ (Invoke-WebRequest -UseBasicParsing http://localhost:3000/ -TimeoutSec 1) | Out-Null; exit 0 } catch { exit 1 }"
  if not errorlevel 1 goto :ready
  timeout /t 1 /nobreak >nul
)
echo Server did not become ready within 120s.
goto :fail

:ready
echo [5/5] Starting Automation...
curl -sS http://localhost:3000/auto || goto :fail

echo.
echo Done. Logs above. Press Ctrl+C to stop the app.
goto :eof

:fail
echo.
echo ERROR. Keeping window open.
pause
