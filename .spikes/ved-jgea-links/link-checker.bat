@echo off
REM Link Checker for V-EdFinance Documentation
REM Usage: link-checker.bat [directory]
REM Default: docs/

setlocal enabledelayedexpansion

set "TARGET_DIR=%~1"
if "%TARGET_DIR%"=="" set "TARGET_DIR=docs"

echo ========================================
echo Link Checker - V-EdFinance
echo Target: %TARGET_DIR%
echo ========================================
echo.

set ERROR_COUNT=0
set FILE_COUNT=0
set LINK_COUNT=0

for /r "%TARGET_DIR%" %%f in (*.md) do (
    set /a FILE_COUNT+=1
    echo Checking: %%~nxf
    
    REM Run link checker and capture output
    npx markdown-link-check "%%f" > .spikes\ved-jgea-links\temp-output.txt 2>&1
    
    REM Check for errors (simplified - looks for [✗] marker)
    findstr /C:"[✗]" .spikes\ved-jgea-links\temp-output.txt >nul
    if !errorlevel! equ 0 (
        set /a ERROR_COUNT+=1
        type .spikes\ved-jgea-links\temp-output.txt
    )
    
    REM Count links (look for "links checked" line)
    for /f "tokens=1" %%a in ('findstr /C:"links checked" .spikes\ved-jgea-links\temp-output.txt') do (
        set /a LINK_COUNT+=%%a
    )
)

del .spikes\ved-jgea-links\temp-output.txt 2>nul

echo.
echo ========================================
echo Summary
echo ========================================
echo Files checked: %FILE_COUNT%
echo Total links: %LINK_COUNT%
echo Broken links: %ERROR_COUNT%
echo ========================================

if %ERROR_COUNT% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)
