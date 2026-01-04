@echo off
REM Verify all CLI tools installation
echo === CLI Tools Verification ===
echo.

echo Checking standalone CLI tools...
echo.

echo [1] Beads (bd):
bd version
echo.

echo [2] Rclone:
C:\rclone\rclone.exe version
echo.

echo [3] Node.js:
node --version
echo.

echo [4] NPM-based tools (via npx):
echo.

echo [4a] pnpm:
npx pnpm --version
echo.

echo [4b] Turbo:
npx turbo --version
echo.

echo [4c] Biome:
npx @biomejs/biome --version
echo.

echo [4d] Vitest:
npx vitest --version
echo.

echo [4e] Playwright:
npx playwright --version
echo.

echo [4f] Prisma:
npx prisma --version
echo.

echo === Verification Complete ===
echo.
pause
