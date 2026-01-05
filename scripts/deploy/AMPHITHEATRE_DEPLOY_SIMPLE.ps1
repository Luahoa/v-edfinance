# Amphitheatre VPS Deployment - Auto Installer
# Auto: Install dependencies + Deploy to VPS

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "Amphitheatre VPS Deployment - Auto Installer" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1: Installing ssh2 dependencies..." -ForegroundColor Yellow
pnpm add ssh2 @types/ssh2 -D -w

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Run Amphitheatre deployment
Write-Host "Step 2: Starting Amphitheatre deployment..." -ForegroundColor Yellow
Write-Host ""

npx tsx scripts/amphitheatre-vps-deploy.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "" 
    Write-Host "Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check .env.e2b file exists with correct credentials" -ForegroundColor White
    Write-Host "  2. Verify VPS is accessible: ping 103.54.153.248" -ForegroundColor White
    Write-Host "  3. Test SSH manually: ssh deployer@103.54.153.248" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 24 hours for pg_stat_statements data" -ForegroundColor White
Write-Host "  2. Test AI Database Architect:" -ForegroundColor White
Write-Host "     curl http://103.54.153.248:3001/api/debug/database/analyze" -ForegroundColor Gray
Write-Host "  3. Monitor Netdata at http://103.54.153.248:19999" -ForegroundColor White
Write-Host ""

pause
