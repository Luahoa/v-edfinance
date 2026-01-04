@echo off
REM ============================================
REM V-EdFinance - P0 Blocker Remediation Script
REM ============================================
REM
REM This script addresses the 5 critical P0 blockers:
REM 1. Prisma Schema Drift
REM 2. Missing next-intl Config  
REM 3. Security Vulnerabilities (Next.js upgrade)
REM 4. Infrastructure Offline
REM 5. Test Environment Issues
REM
REM USAGE: Run from project root
REM ============================================

echo.
echo ========================================
echo  V-EDFINANCE P0 BLOCKER REMEDIATION
echo ========================================
echo.
echo This script will attempt to resolve the 5 critical blockers.
echo Press Ctrl+C to cancel, or any key to continue...
pause > nul

echo.
echo [PHASE 1/5] Checking Docker Desktop...
echo ----------------------------------------

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop manually and re-run this script.
    echo.
    echo Press any key to exit...
    pause > nul
    exit /b 1
)

echo OK: Docker is running

echo.
echo [PHASE 2/5] Starting Local Infrastructure...
echo ----------------------------------------

echo Starting PostgreSQL...
docker compose up -d postgres
if %errorlevel% neq 0 (
    echo WARNING: Failed to start PostgreSQL
    echo Continuing anyway...
) else (
    echo OK: PostgreSQL started
)

echo Waiting for database to be ready... (10 seconds)
timeout /t 10 /nobreak > nul

echo.
echo [PHASE 3/5] Fixing Prisma Schema...
echo ----------------------------------------

echo Generating Prisma Client...
call pnpm prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed!
    echo.
    echo You need to manually fix the schema.prisma file first.
    echo See TECHNICAL_DEBT_AUDIT_REPORT.md for required changes.
    echo.
    echo Press any key to exit...
    pause > nul
    exit /b 1
)

echo Running database migrations...
call pnpm prisma migrate deploy
if %errorlevel% neq 0 (
    echo WARNING: Migrations failed. You may need to create new migrations.
    echo Run: pnpm prisma migrate dev --name add-missing-fields
)

echo.
echo [PHASE 4/5] Patching Security Vulnerabilities...
echo ----------------------------------------

echo Upgrading Next.js to 15.1.10 (patches CVE-2025-29927, CVE-2025-55182)...
call pnpm add next@15.1.10 --filter web
if %errorlevel% neq 0 (
    echo ERROR: Failed to upgrade Next.js
    echo You may need to resolve dependency conflicts manually
) else (
    echo OK: Next.js upgraded
)

echo.
echo [PHASE 5/5] Testing Builds...
echo ----------------------------------------

echo Testing API build...
call pnpm --filter api build
if %errorlevel% neq 0 (
    echo ERROR: API build still failing!
    echo Review errors above and check TECHNICAL_DEBT_AUDIT_REPORT.md
    set API_BUILD_FAILED=1
) else (
    echo OK: API build successful!
    set API_BUILD_FAILED=0
)

echo.
echo Testing Web build...
call pnpm --filter web build
if %errorlevel% neq 0 (
    echo ERROR: Web build still failing!
    echo You may need to create apps/web/src/i18n/request.ts manually
    set WEB_BUILD_FAILED=1
) else (
    echo OK: Web build successful!
    set WEB_BUILD_FAILED=0
)

echo.
echo ========================================
echo  REMEDIATION SUMMARY
echo ========================================
echo.

if %API_BUILD_FAILED%==0 if %WEB_BUILD_FAILED%==0 (
    echo STATUS: SUCCESS - All builds passing!
    echo.
    echo Next steps:
    echo 1. Run tests: pnpm test
    echo 2. Run E2E tests: pnpm test:e2e
    echo 3. Check coverage: pnpm test --coverage
    echo.
    echo See TECHNICAL_DEBT_AUDIT_REPORT.md for complete roadmap.
) else (
    echo STATUS: PARTIAL - Some builds still failing
    echo.
    echo Please review the errors above and:
    echo 1. Check TECHNICAL_DEBT_AUDIT_REPORT.md for detailed fixes
    echo 2. Manually update schema.prisma if needed
    echo 3. Create apps/web/src/i18n/request.ts if needed
    echo.
)

echo.
echo Running security audit...
call pnpm audit --filter web
echo.

echo ========================================
echo Press any key to exit...
pause > nul
