#!/usr/bin/env pwsh
Write-Host "Building API..." -ForegroundColor Cyan
cd "apps/api"
pnpm build 2>&1 | Tee-Object -Variable buildOutput
$errors = $buildOutput | Select-String -Pattern "error TS"
$errorCount = ($errors | Measure-Object).Count
Write-Host "`n=== BUILD SUMMARY ===" -ForegroundColor Yellow
Write-Host "Total TypeScript Errors: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) {"Green"} else {"Red"})
if ($errorCount -gt 0) {
    Write-Host "`nFirst 30 errors:" -ForegroundColor Red
    $errors | Select-Object -First 30
}
