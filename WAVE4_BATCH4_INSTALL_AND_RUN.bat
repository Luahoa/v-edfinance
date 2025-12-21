@echo off
echo Installing @axe-core/playwright for accessibility testing...
pnpm add -D @axe-core/playwright

echo.
echo Running Wave 4 Batch 4 E2E Tests...
npx playwright test tests/e2e/error-handling.spec.ts --reporter=html
npx playwright test tests/e2e/offline-mode.spec.ts --reporter=html
npx playwright test tests/e2e/session-management.spec.ts --reporter=html
npx playwright test tests/e2e/performance-load.spec.ts --reporter=html
npx playwright test tests/e2e/accessibility.spec.ts --reporter=html

echo.
echo Generating summary report...
npx playwright show-report
