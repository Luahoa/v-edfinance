@echo off
REM ========================================
REM Session Handoff Executor
REM Generated: 2025-12-22 02:00 AM
REM ========================================

echo.
echo ====================================
echo V-EdFinance - Session Continuation
echo ====================================
echo.

cd /d "c:\Users\luaho\Demo project\v-edfinance"

echo [Step 1/4] Merging duplicate issues...
echo.
bd merge ved-gsn ved-3fw --into ved-3fw --json
bd merge ved-rkk ved-s3c --into ved-s3c --json
echo.

echo [Step 2/4] Running tests to verify fix...
echo.
echo Running nudge personalization tests...
call pnpm test apps/api/src/modules/nudge/personalization.service.spec.ts
echo.

echo [Step 3/4] Updating ved-sm0 progress...
echo.
bd update ved-sm0 --notes "Fixed jest→vi.clearAllMocks() syntax in personalization.service.spec.ts. Expected to resolve ~39 test failures. Identified and prepared to merge 4 duplicate DevOps issues (R2 + Gemini)." --json
echo.

echo [Step 4/4] Committing and pushing changes...
echo.
git add apps/api/src/modules/nudge/personalization.service.spec.ts
git add SESSION_HANDOFF_2025-12-22_02h00.md
git add EXECUTE_NEXT.bat
git commit -m "fix(tests): Replace jest.clearAllMocks with vi.clearAllMocks in nudge personalization tests - Fixed line 60 in personalization.service.spec.ts - Identified duplicate issues: ved-3fw/ved-gsn, ved-s3c/ved-rkk - Expected to fix ~39 test failures"
git push
bd sync
echo.

echo ====================================
echo All steps completed!
echo ====================================
echo.
echo Next: Run full test suite to get updated baseline
echo   pnpm test ^> test_output_updated.txt 2^>^&1
echo.
pause
