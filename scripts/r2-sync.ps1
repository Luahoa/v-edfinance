# Rclone R2 Sync Script
# Backup and sync files to Cloudflare R2

param(
    [switch]$DryRun,
    [switch]$Verbose,
    [string]$Source = ".\uploads",
    [string]$Remote = "r2:v-edfinance-bucket/uploads"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Rclone R2 Sync Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if rclone is installed
try {
    $rcloneVersion = & rclone version 2>&1 | Select-String "rclone v"
    Write-Host "[INFO] Using $rcloneVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Rclone not found. Please run INSTALL_RCLONE.bat first" -ForegroundColor Red
    exit 1
}

# Check if R2 remote is configured
Write-Host "[INFO] Checking R2 configuration..." -ForegroundColor Yellow
try {
    $remotes = & rclone listremotes 2>&1
    if ($remotes -notcontains "r2:") {
        Write-Host "[WARNING] R2 remote not configured" -ForegroundColor Yellow
        Write-Host "Please run: rclone config" -ForegroundColor Yellow
        Write-Host "And configure your Cloudflare R2 connection" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[OK] R2 remote configured" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to check remotes: $_" -ForegroundColor Red
    exit 1
}

# Build rclone command
$rcloneArgs = @(
    "sync",
    $Source,
    $Remote,
    "--progress"
)

if ($DryRun) {
    $rcloneArgs += "--dry-run"
    Write-Host "[INFO] DRY RUN MODE - No files will be transferred" -ForegroundColor Yellow
}

if ($Verbose) {
    $rcloneArgs += "-vv"
}

# Additional recommended flags
$rcloneArgs += @(
    "--checksum",           # Verify with checksums
    "--transfers=4",        # Parallel transfers
    "--checkers=8",         # Parallel checks
    "--retries=3",          # Retry failed transfers
    "--low-level-retries=10",
    "--stats=10s",          # Stats every 10 seconds
    "--stats-one-line"      # Compact stats
)

Write-Host ""
Write-Host "[INFO] Syncing: $Source -> $Remote" -ForegroundColor Cyan
Write-Host ""

try {
    & rclone $rcloneArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[SUCCESS] Sync completed successfully" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "[ERROR] Sync failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "[ERROR] Sync failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Sync Complete ===" -ForegroundColor Green
Write-Host ""
