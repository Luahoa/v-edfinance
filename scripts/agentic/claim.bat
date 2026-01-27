@echo off
if "%1"=="" (
    echo Usage: claim ^<bead-id^>
    echo Example: claim ved-xxxx
    exit /b 1
)
"%~dp0..\..\beads.exe" update %1 --status=in_progress
echo.
echo Claimed: %1
echo Now working on this task...
