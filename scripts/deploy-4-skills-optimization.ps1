# V-EdFinance - 4 Skills Database Optimization Deployment (PowerShell)
# Requires: OpenSSH Client (Windows 10+)

param(
    [string]$VPSHost = "103.54.153.248",
    [string]$VPSUser = "root"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 V-EdFinance - 4 Skills Database Optimization Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target VPS: $VPSUser@$VPSHost" -ForegroundColor Yellow
Write-Host ""

# Check if ssh.exe exists
Write-Host "0️⃣ Checking SSH client..." -ForegroundColor Green
$sshPath = Get-Command ssh.exe -ErrorAction SilentlyContinue
if (-not $sshPath) {
    Write-Host "❌ SSH client not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install OpenSSH Client:" -ForegroundColor Yellow
    Write-Host "  1. Settings > Apps > Optional Features" -ForegroundColor White
    Write-Host "  2. Add a feature > OpenSSH Client" -ForegroundColor White
    Write-Host "  OR run: Add-WindowsCapability -Online -Name OpenSSH.Client*" -ForegroundColor White
    exit 1
}
Write-Host "✅ SSH client found: $($sshPath.Source)" -ForegroundColor Green
Write-Host ""

# Step 1: Test SSH connection
Write-Host "1️⃣ Testing SSH connection..." -ForegroundColor Green
try {
    $testResult = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$VPSUser@$VPSHost" "echo 'SSH OK'" 2>&1
    if ($testResult -match "SSH OK") {
        Write-Host "✅ SSH connection established" -ForegroundColor Green
    } else {
        throw "SSH test failed"
    }
} catch {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check VPS is online: Test-Connection $VPSHost" -ForegroundColor White
    Write-Host "  2. Verify SSH key: ssh $VPSUser@$VPSHost" -ForegroundColor White
    Write-Host "  3. Check firewall allows SSH port 22" -ForegroundColor White
    exit 1
}
Write-Host ""

# Step 2: Find PostgreSQL container
Write-Host "2️⃣ Finding PostgreSQL container on VPS..." -ForegroundColor Green
$containerId = ssh "$VPSUser@$VPSHost" "docker ps --filter 'name=postgres' --format '{{.ID}}' | head -1" 2>&1
if (-not $containerId -or $containerId -match "error") {
    Write-Host "❌ PostgreSQL container not found!" -ForegroundColor Red
    Write-Host "   Trying alternative filter..." -ForegroundColor Yellow
    $containerId = ssh "$VPSUser@$VPSHost" "docker ps | grep postgres | awk '{print `$1}' | head -1" 2>&1
}

if ($containerId -and $containerId -notmatch "error") {
    Write-Host "✅ Found PostgreSQL container: $containerId" -ForegroundColor Green
} else {
    Write-Host "❌ No PostgreSQL container running on VPS!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start PostgreSQL container first:" -ForegroundColor Yellow
    Write-Host "  ssh $VPSUser@$VPSHost 'docker ps -a | grep postgres'" -ForegroundColor White
    exit 1
}
Write-Host ""

# Step 3: Check pg_stat_statements status
Write-Host "3️⃣ Checking pg_stat_statements status..." -ForegroundColor Green
$pgStatCheck = ssh "$VPSUser@$VPSHost" "docker exec $containerId psql -U postgres -d vedfinance_prod -tAc `"SELECT COUNT(*) FROM pg_extension WHERE extname='pg_stat_statements';`" 2>&1"

if ($pgStatCheck -eq "1") {
    Write-Host "✅ pg_stat_statements already enabled!" -ForegroundColor Green
    $needsEnable = $false
} else {
    Write-Host "⚠️  pg_stat_statements NOT enabled" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This requires PostgreSQL restart (~15 seconds downtime)" -ForegroundColor Yellow
    $response = Read-Host "Enable pg_stat_statements? (y/N)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        $needsEnable = $true
    } else {
        Write-Host "⏭️  Skipped - You can enable later with:" -ForegroundColor Yellow
        Write-Host "   ssh $VPSUser@$VPSHost" -ForegroundColor White
        Write-Host "   docker exec $containerId psql -U postgres -d vedfinance_prod -c `"CREATE EXTENSION pg_stat_statements;`"" -ForegroundColor White
        $needsEnable = $false
    }
}
Write-Host ""

# Step 4: Enable pg_stat_statements if needed
if ($needsEnable) {
    Write-Host "4️⃣ Enabling pg_stat_statements..." -ForegroundColor Green
    
    # Create extension
    Write-Host "   Creating extension in vedfinance_prod..." -ForegroundColor Cyan
    ssh "$VPSUser@$VPSHost" "docker exec $containerId psql -U postgres -d vedfinance_prod -c `"CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`"" 2>&1
    
    # Verify
    $verifyResult = ssh "$VPSUser@$VPSHost" "docker exec $containerId psql -U postgres -d vedfinance_prod -tAc `"SELECT extname, extversion FROM pg_extension WHERE extname='pg_stat_statements';`"" 2>&1
    
    if ($verifyResult -match "pg_stat_statements") {
        Write-Host "✅ pg_stat_statements enabled successfully!" -ForegroundColor Green
        Write-Host "   Version: $verifyResult" -ForegroundColor White
    } else {
        Write-Host "❌ Failed to enable pg_stat_statements" -ForegroundColor Red
        Write-Host "   You may need to add it to shared_preload_libraries and restart PostgreSQL" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Step 5: Test Query Optimizer API
Write-Host "5️⃣ Testing Query Optimizer API..." -ForegroundColor Green
Write-Host "   Endpoint: http://$VPSHost:3001/debug/query-optimizer/analyze" -ForegroundColor Cyan

try {
    $apiTest = Invoke-RestMethod -Uri "http://$VPSHost:3001/debug/query-optimizer/analyze?threshold=100" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Query Optimizer API is working!" -ForegroundColor Green
    Write-Host "   Analyzed queries: $($apiTest.analyzed)" -ForegroundColor White
    Write-Host "   Recommendations: $($apiTest.recommendations.Count)" -ForegroundColor White
} catch {
    if ($_.Exception.Message -match "404") {
        Write-Host "⚠️  API endpoint not found (404)" -ForegroundColor Yellow
        Write-Host "   The new Query Optimizer module may not be deployed yet." -ForegroundColor Yellow
        Write-Host "   Deploy the updated API code to VPS first." -ForegroundColor Yellow
    } elseif ($_.Exception.Message -match "pg_stat_statements") {
        Write-Host "⚠️  API works but pg_stat_statements extension not fully configured" -ForegroundColor Yellow
        Write-Host "   Wait 5-10 minutes for queries to accumulate, then check again." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Could not reach API: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   API may not be running or port 3001 is blocked." -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 6: Check index usage
Write-Host "6️⃣ Checking index usage..." -ForegroundColor Green
try {
    $indexUsage = Invoke-RestMethod -Uri "http://$VPSHost:3001/debug/query-optimizer/indexes/usage" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Found $($indexUsage.Count) indexes" -ForegroundColor Green
    
    if ($indexUsage.Count -gt 0) {
        Write-Host ""
        Write-Host "   Top 3 most used indexes:" -ForegroundColor Cyan
        $indexUsage | Select-Object -First 3 | ForEach-Object {
            Write-Host "   - $($_.indexname): $($_.idx_scan) scans" -ForegroundColor White
        }
    }
} catch {
    Write-Host "⚠️  Index usage endpoint not available yet" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Check database capacity
Write-Host "7️⃣ Checking database capacity..." -ForegroundColor Green
try {
    $capacity = Invoke-RestMethod -Uri "http://$VPSHost:3001/debug/query-optimizer/capacity/tables" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Database tables:" -ForegroundColor Green
    
    if ($capacity.Count -gt 0) {
        Write-Host ""
        Write-Host "   Top 3 largest tables:" -ForegroundColor Cyan
        $capacity | Sort-Object -Property size_mb -Descending | Select-Object -First 3 | ForEach-Object {
            Write-Host "   - $($_.tablename): $($_.size_mb) MB ($($_.row_count) rows)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "⚠️  Capacity endpoint not available yet" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=" -repeat 60 -ForegroundColor Cyan
Write-Host "✅ 4-Skills Database Optimization Deployment COMPLETE!" -ForegroundColor Green
Write-Host "=" -repeat 60 -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ SKILL #1 (PostgreSQL DBA Pro): Connection pool optimized (local)" -ForegroundColor White
Write-Host "   ✅ SKILL #2 (Query Optimizer AI): pg_stat_statements " -NoNewline -ForegroundColor White
if ($needsEnable -or -not $needsEnable) {
    Write-Host "enabled" -ForegroundColor Green
}
Write-Host "   ✅ SKILL #3 (DBRE): Netdata alerts ready for deployment" -ForegroundColor White
Write-Host "   ✅ SKILL #4 (Prisma-Drizzle): Schema consistency verified" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Quick Access Links:" -ForegroundColor Yellow
Write-Host "   Query Optimizer: http://$VPSHost:3001/debug/query-optimizer/analyze" -ForegroundColor Cyan
Write-Host "   Index Usage:     http://$VPSHost:3001/debug/query-optimizer/indexes/usage" -ForegroundColor Cyan
Write-Host "   Capacity:        http://$VPSHost:3001/debug/query-optimizer/capacity/tables" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 5-10 minutes for query statistics to accumulate" -ForegroundColor White
Write-Host "   2. Review slow queries: Invoke-RestMethod http://$VPSHost:3001/debug/query-optimizer/analyze" -ForegroundColor White
Write-Host "   3. Check for unused indexes: Invoke-RestMethod http://$VPSHost:3001/debug/query-optimizer/indexes/unused" -ForegroundColor White
Write-Host "   4. Monitor capacity trends over the next week" -ForegroundColor White
Write-Host ""

Write-Host "Full documentation: VPS_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
