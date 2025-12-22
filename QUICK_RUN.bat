@echo off
echo ========================================
echo QUICK START - AI Test Generator
echo ========================================
echo.

echo Step 1: Running AI Test Generator...
echo.
cd scripts
call pnpm ts-node ai-test-generator.ts
cd ..

echo.
echo Step 2: Running Tests...
cd apps\api
call pnpm test

echo.
echo Step 3: Generating Coverage Report...
call pnpm test:cov

echo.
echo Step 4: Opening Coverage Report...
start coverage\lcov-report\index.html

echo.
echo ========================================
echo COMPLETE! Check the browser for coverage report
echo ========================================
pause
