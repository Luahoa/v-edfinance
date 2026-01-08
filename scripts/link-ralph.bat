@echo off
REM Ralph CLI Symlink Setup
REM Creates symlinks to use Ralph from v-edfinance in other projects

if "%1"=="" (
    echo Usage: link-ralph.bat <target-project-path>
    echo Example: link-ralph.bat E:\MyApp
    exit /b 1
)

set TARGET=%1
set SOURCE=e:\Demo project\v-edfinance

echo Creating Ralph symlinks for %TARGET%...

REM Create libs directory if not exists
if not exist "%TARGET%\libs" mkdir "%TARGET%\libs"

REM Create symlink to ralph-cli
mklink /D "%TARGET%\libs\ralph-cli" "%SOURCE%\libs\ralph-cli"

REM Copy config (don't symlink to avoid conflicts)
copy "%SOURCE%\ralph.config.json" "%TARGET%\ralph.config.json"
copy "%SOURCE%\test-ralph.bat" "%TARGET%\test-ralph.bat"

REM Symlink scripts
if not exist "%TARGET%\scripts" mkdir "%TARGET%\scripts"
mklink "%TARGET%\scripts\quality-gate-ultra-fast.bat" "%SOURCE%\scripts\quality-gate-ultra-fast.bat"

echo.
echo Ralph CLI linked successfully!
echo Run: cd %TARGET% ^&^& test-ralph.bat --help
