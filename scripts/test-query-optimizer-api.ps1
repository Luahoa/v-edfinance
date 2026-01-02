# Test Query Optimizer API Endpoints
param(
    [string]$VPSHost = "103.54.153.248"
)

$baseUrl = "http://${VPSHost}:3001"

Write-Host "Testing Query Optimizer API Endpoints" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health check
Write-Host "1. Testing API health..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -TimeoutSec 5
    Write-Host "   OK API is running" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor White
} catch {
    Write-Host "   FAIL API not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   API may not be deployed yet" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Query Optimizer - Analyze
Write-Host "2. Testing /debug/query-optimizer/analyze..." -ForegroundColor Green
try {
    $analyze = Invoke-RestMethod -Uri "$baseUrl/debug/query-optimizer/analyze?threshold=100" -TimeoutSec 10
    Write-Host "   OK Query Optimizer is working!" -ForegroundColor Green
    Write-Host "   Analyzed: $($analyze.analyzed) queries" -ForegroundColor White
    Write-Host "   Threshold: $($analyze.threshold)" -ForegroundColor White
    Write-Host "   Recommendations: $($analyze.recommendations.Count)" -ForegroundColor White
    
    if ($analyze.recommendations.Count -gt 0) {
        Write-Host ""
        Write-Host "   Top recommendation:" -ForegroundColor Cyan
        $top = $analyze.recommendations[0]
        Write-Host "   - Query: $($top.query.Substring(0, [Math]::Min(60, $top.query.Length)))..." -ForegroundColor White
        Write-Host "   - Mean time: $($top.metrics.meanTime)ms" -ForegroundColor White
        Write-Host "   - Calls: $($top.metrics.calls)" -ForegroundColor White
    }
} catch {
    if ($_.Exception.Message -match "404") {
        Write-Host "   FAIL Endpoint not found (404)" -ForegroundColor Red
        Write-Host "   The Query Optimizer module needs to be deployed to VPS" -ForegroundColor Yellow
    } elseif ($_.Exception.Message -match "pg_stat_statements") {
        Write-Host "   FAIL pg_stat_statements extension not enabled" -ForegroundColor Red
        Write-Host "   Run: ssh root@$VPSHost" -ForegroundColor Yellow
        Write-Host "        docker exec <postgres_container> psql -U postgres -d vedfinance_prod -c 'CREATE EXTENSION pg_stat_statements;'" -ForegroundColor Yellow
    } else {
        Write-Host "   FAIL $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Index Usage
Write-Host "3. Testing /debug/query-optimizer/indexes/usage..." -ForegroundColor Green
try {
    $indexes = Invoke-RestMethod -Uri "$baseUrl/debug/query-optimizer/indexes/usage" -TimeoutSec 10
    Write-Host "   OK Found $($indexes.Count) indexes" -ForegroundColor Green
    
    if ($indexes.Count -gt 0) {
        Write-Host ""
        Write-Host "   Top 3 most used:" -ForegroundColor Cyan
        $indexes | Sort-Object -Property idx_scan -Descending | Select-Object -First 3 | ForEach-Object {
            Write-Host "   - $($_.indexname): $($_.idx_scan) scans" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   SKIP Endpoint not available: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Unused Indexes
Write-Host "4. Testing /debug/query-optimizer/indexes/unused..." -ForegroundColor Green
try {
    $unused = Invoke-RestMethod -Uri "$baseUrl/debug/query-optimizer/indexes/unused" -TimeoutSec 10
    if ($unused.Count -eq 0) {
        Write-Host "   OK No unused indexes (excellent!)" -ForegroundColor Green
    } else {
        Write-Host "   WARN Found $($unused.Count) unused indexes" -ForegroundColor Yellow
        $unused | ForEach-Object {
            Write-Host "   - $($_.indexname): $($_.size_mb) MB, $($_.idx_scan) scans" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   SKIP Endpoint not available" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Capacity
Write-Host "5. Testing /debug/query-optimizer/capacity/tables..." -ForegroundColor Green
try {
    $capacity = Invoke-RestMethod -Uri "$baseUrl/debug/query-optimizer/capacity/tables" -TimeoutSec 10
    Write-Host "   OK Database capacity check successful" -ForegroundColor Green
    
    if ($capacity.Count -gt 0) {
        Write-Host ""
        Write-Host "   Top 3 largest tables:" -ForegroundColor Cyan
        $capacity | Sort-Object -Property size_mb -Descending | Select-Object -First 3 | ForEach-Object {
            Write-Host "   - $($_.tablename): $($_.size_mb) MB ($($_.row_count) rows)" -ForegroundColor White
        }
        
        $totalSize = ($capacity | Measure-Object -Property size_mb -Sum).Sum
        Write-Host ""
        Write-Host "   Total DB size: $([Math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   SKIP Endpoint not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Test Complete!" -ForegroundColor Green
