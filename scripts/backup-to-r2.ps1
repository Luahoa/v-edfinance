# V-EdFinance PostgreSQL Backup to Cloudflare R2 (Windows)
# Run manually or via Task Scheduler

param(
    [string]$BackupDir = "C:\backups\postgres",
    [string]$R2Bucket = "v-edfinance-backup",
    [string]$R2Path = "postgres",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] " -NoNewline
    Write-Host $Message -ForegroundColor $color
}

# Check prerequisites
if (-not (Get-Command rclone -ErrorAction SilentlyContinue)) {
    Write-Log "rclone not found. Install from https://rclone.org/downloads/" "ERROR"
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Log "Docker not found" "ERROR"
    exit 1
}

# Check R2 remote
$remotes = rclone listremotes
if ($remotes -notcontains "r2:") {
    Write-Log "R2 remote not configured. Run: rclone config" "ERROR"
    exit 1
}

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Find PostgreSQL container
$postgresContainer = docker ps --filter "name=postgres" --format "{{.Names}}" | Select-Object -First 1

if (-not $postgresContainer) {
    Write-Log "PostgreSQL container not found" "ERROR"
    exit 1
}

Write-Log "Starting backup from container: $postgresContainer"

# Create backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "vedfinance_all_$timestamp.sql.gz"

Write-Log "Creating backup: $backupFile"

# Execute pg_dumpall and compress
docker exec -t $postgresContainer pg_dumpall -U postgres | gzip > $backupFile

if (-not (Test-Path $backupFile)) {
    Write-Log "Backup file not created" "ERROR"
    exit 1
}

$backupSize = (Get-Item $backupFile).Length / 1MB
Write-Log "Backup created successfully (Size: $([math]::Round($backupSize, 2)) MB)" "SUCCESS"

# Upload to R2
Write-Log "Uploading to R2: r2:$R2Bucket/$R2Path/"
rclone copy $backupFile "r2:$R2Bucket/$R2Path/" `
    --progress `
    --transfers 4 `
    --checkers 8

if ($LASTEXITCODE -eq 0) {
    Write-Log "Upload to R2 successful" "SUCCESS"
} else {
    Write-Log "Upload to R2 failed" "ERROR"
    exit 1
}

# Verify upload
Write-Log "Verifying upload..."
$r2File = "r2:$R2Bucket/$R2Path/$(Split-Path $backupFile -Leaf)"
$verify = rclone ls $r2File 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Log "✓ Backup verified on R2" "SUCCESS"
} else {
    Write-Log "Backup verification failed" "ERROR"
    exit 1
}

# Clean up old local backups (keep last 7 days)
Write-Log "Cleaning up local backups older than 7 days..."
Get-ChildItem -Path $BackupDir -Filter "vedfinance_all_*.sql.gz" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
    Remove-Item -Force

# Clean up old R2 backups
Write-Log "Cleaning up R2 backups older than $RetentionDays days..."
rclone delete "r2:$R2Bucket/$R2Path/" `
    --min-age "${RetentionDays}d" `
    --include "vedfinance_all_*.sql.gz"

# Generate backup report
$report = @"
Timestamp: $(Get-Date)
Backup File: $(Split-Path $backupFile -Leaf)
Size: $([math]::Round($backupSize, 2)) MB
R2 Location: r2:$R2Bucket/$R2Path/$(Split-Path $backupFile -Leaf)
Status: SUCCESS
"@

$report | Out-File -FilePath (Join-Path $BackupDir "last_backup.log") -Encoding UTF8

Write-Log "Backup process completed successfully" "SUCCESS"
Write-Log "Report saved to: $(Join-Path $BackupDir 'last_backup.log')"

exit 0
