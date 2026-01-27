@echo off
if "%1"=="" (
    echo Usage: close ^<bead-id^> ["reason"]
    echo Example: close ved-xxxx "Implemented feature"
    exit /b 1
)
if "%~2"=="" (
    "%~dp0..\..\beads.exe" close %1 --reason "Completed"
) else (
    "%~dp0..\..\beads.exe" close %1 --reason "%~2"
)
echo.
echo Closed: %1
