# VED-6YB: Enable Pgvector Extension on VPS PostgreSQL
# Run this in PowerShell with admin privileges

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VED-6YB: Enable Pgvector on VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find PostgreSQL container
Write-Host "🔍 Finding PostgreSQL container..." -ForegroundColor Yellow
$findCommand = "docker ps --format '{{.ID}}|{{.Image}}|{{.Names}}'"
Write-Host "Run on VPS: $findCommand" -ForegroundColor Gray
Write-Host ""
Write-Host "Paste the container ID here (or press Enter to continue with manual ID):" -ForegroundColor Yellow
$containerId = Read-Host

if ([string]::IsNullOrWhiteSpace($containerId)) {
    Write-Host ""
    Write-Host "Please run these commands on your Bitvise SSH terminal:" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Command 1: Find container
    Write-Host "# 1. Find PostgreSQL container" -ForegroundColor Green
    Write-Host "docker ps | grep postgres" -ForegroundColor White
    Write-Host ""
    
    # Command 2: Enable pgvector on all databases
    Write-Host "# 2. Enable pgvector (replace <container_id> with actual ID)" -ForegroundColor Green
    Write-Host "CONTAINER_ID=<your_container_id_here>" -ForegroundColor White
    Write-Host ""
    
    $databases = @("v_edfinance", "vedfinance_prod", "vedfinance_staging", "vedfinance_dev")
    foreach ($db in $databases) {
        Write-Host "docker exec `$CONTAINER_ID psql -U postgres -d $db -c `"CREATE EXTENSION IF NOT EXISTS vector;`"" -ForegroundColor White
    }
    Write-Host ""
    
    # Command 3: Verify
    Write-Host "# 3. Verify installations" -ForegroundColor Green
    foreach ($db in $databases) {
        Write-Host "docker exec `$CONTAINER_ID psql -U postgres -d $db -c `"SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';`"" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "After running these commands, press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    Write-Host ""
    Write-Host "✅ Great! Now close VED-6YB in beads:" -ForegroundColor Green
    Write-Host "   .\beads.exe close ved-6yb --reason `"Enabled pgvector on all VPS databases`"" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "Using container ID: $containerId" -ForegroundColor Green
    Write-Host ""
    Write-Host "Commands to run on VPS:" -ForegroundColor Yellow
    
    $databases = @("v_edfinance", "vedfinance_prod", "vedfinance_staging", "vedfinance_dev")
    foreach ($db in $databases) {
        Write-Host "docker exec $containerId psql -U postgres -d $db -c `"CREATE EXTENSION IF NOT EXISTS vector;`"" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Script completed. Check VPS terminal for results." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
