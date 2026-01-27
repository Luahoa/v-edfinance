@echo off
REM Spawn parallel workers for multi-agent execution
REM Usage: spawn-workers ved-track1 ved-track2 ved-track3

if "%1"=="" (
    echo Usage: spawn-workers ^<bead-id-1^> [bead-id-2] [bead-id-3] ...
    echo Example: spawn-workers ved-track1 ved-track2 ved-track3
    exit /b 1
)

echo.
echo === Spawning Parallel Workers ===
echo.

:loop
if "%1"=="" goto done
echo Spawning worker for: %1
"%~dp0..\..\gt.exe" polecat spawn --bead %1
shift
goto loop

:done
echo.
echo All workers spawned. Monitor with: gt status
