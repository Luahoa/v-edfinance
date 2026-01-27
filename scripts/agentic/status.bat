@echo off
echo.
echo === Agentic Toolkit Status ===
echo.

echo [Beads - Open Tasks]
"%~dp0..\..\beads.exe" list --status open --json 2>nul | findstr /c:"open" >nul
if %errorlevel%==0 (
    for /f %%i in ('"%~dp0..\..\beads.exe" list --status open --json 2^>nul ^| findstr /c:"\"status\":\"open\"" ^| find /c /v ""') do echo   Open tasks: %%i
) else (
    echo   Unable to count
)

echo.
echo [Top 3 Recommendations]
"%~dp0..\..\bv.exe" --robot-next 2>nul

echo.
echo [Gastown Status]
"%~dp0..\..\gt.exe" status 2>nul || echo   Gastown not initialized

echo.
