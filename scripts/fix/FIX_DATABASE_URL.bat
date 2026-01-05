@echo off
echo ================================
echo FIX DATABASE_URL CREDENTIALS
echo ================================
echo.

cd /d "C:\Users\luaho\Demo project\v-edfinance\apps\api"

REM Backup original .env
if exist .env (
    echo Backing up .env to .env.backup...
    copy /y .env .env.backup >nul
)

REM Check current DATABASE_URL
echo Current DATABASE_URL:
type .env 2>nul | findstr DATABASE_URL
echo.

REM Fix DATABASE_URL
echo Updating DATABASE_URL to match Docker...
powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/v_edfinance\"' | Set-Content .env"

echo.
echo New DATABASE_URL:
type .env | findstr DATABASE_URL
echo.

echo ================================
echo DATABASE_URL Fixed!
echo ================================
echo.
echo Next: Re-run SETUP_DATABASE.bat
echo.
pause
