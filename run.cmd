@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem === Disable Quick Edit just for this window ===
powershell -NoProfile -ExecutionPolicy Bypass -Command "$sig='using System; using System.Runtime.InteropServices; public static class K{ [DllImport(\"kernel32.dll\")] public static extern System.IntPtr GetStdHandle(int nStdHandle); [DllImport(\"kernel32.dll\")] public static extern bool GetConsoleMode(System.IntPtr h, out uint m); [DllImport(\"kernel32.dll\")] public static extern bool SetConsoleMode(System.IntPtr h, uint m);}'; Add-Type -TypeDefinition $sig -IgnoreWarnings | Out-Null; $h=[K]::GetStdHandle(-10); [uint32]$m=0; [K]::GetConsoleMode($h,[ref]$m) | Out-Null; $m = ($m -bor 0x80) -band (-bnot 0x40) -band (-bnot 0x20); [K]::SetConsoleMode($h,$m) | Out-Null" || echo (Quick Edit toggle skipped)

rem =========================
rem [0/5] Sync with remote (force if local changed)
rem =========================
echo [0/5] Checking for updates...

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
for /f %%c in ('git status --porcelain - uno ^| find /v /c ""') do set "WT_COUNT=%%c"
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

rem =========================================================
rem [3/5] Starting server... (High priority + dynamic affinity)
rem =========================================================

rem Optional override: set how many cores Node should use (blank = auto half)
set "USE_CORES="

echo [3/5] Choosing least-loaded CPU cores for Node...
for /f "usebackq delims=" %%A in (`
  powershell -NoProfile -ExecutionPolicy Bypass ^
    "$n=[Environment]::ProcessorCount;" ^
    "$use='%USE_CORES%'; if([string]::IsNullOrWhiteSpace($use)){ $use=[Math]::Max([int]($n/2),1) } else { $use=[int]$use } ; $use=[Math]::Min($use,$n);" ^
    "try { $cs=(Get-Counter '\Processor(*)\% Processor Time' -SampleInterval 0.25 -MaxSamples 1).CounterSamples | ?{ $_.InstanceName -match '^\d+$' } } catch { $cs=$null };" ^
    "if(-not $cs){ $sel=0..($use-1) } else { $sel=($cs | Sort-Object CookedValue | Select-Object -First $use | ForEach-Object { [int]$_.InstanceName }) };" ^
    "[UInt64]$mask=0; foreach($i in $sel){ $mask = $mask -bor (1uL -shl $i) };" ^
    "('{0:X}' -f $mask)"
`) do set "AFF_MASK=%%A"

if not defined AFF_MASK (
  rem Fallback: first half cores
  for /f "usebackq delims=" %%A in (`
    powershell -NoProfile -ExecutionPolicy Bypass ^
      "$n=[Environment]::ProcessorCount; $use=[Math]::Max([int]($n/2),1); [UInt64]$m=0; for($i=0;$i -lt $use;$i++){ $m=$m -bor (1uL -shl $i) }; ('{0:X}' -f $m)"
  `) do set "AFF_MASK=%%A"
)

echo   - Selected affinity mask (hex): %AFF_MASK%
echo   - Launching Node with HIGH priority and affinity...

start "" /HIGH /AFFINITY %AFF_MASK% cmd /c "npm start"
timeout /t 1 /nobreak >nul

rem Comment this block out if you don't want it.
powershell -NoProfile -ExecutionPolicy Bypass ^
  "$n=[Environment]::ProcessorCount; $all= [UInt64]0; for($i=0;$i -lt $n;$i++){ $all = $all -bor (1uL -shl $i) };" ^
  "$nodeMask = [UInt64]('0x' + '%AFF_MASK%'); $capMask = $all -bxor $nodeMask; if($capMask -eq 0){ $capMask=$all };" ^
