# Quick CLI Tools Check
# This script checks all installed CLI tools

$tools = @()

Write-Host "=== CLI Tools Verification Report ===" -ForegroundColor Cyan
Write-Host ""

# Standalone tools
Write-Host "Standalone CLI Tools:" -ForegroundColor Yellow
Write-Host ""

# Beads
try {
    $bdVersion = (bd version 2>&1 | Select-String "version").ToString().Trim()
    Write-Host "[OK] Beads: $bdVersion" -ForegroundColor Green
    $tools += @{Name="Beads (bd)"; Status="OK"; Version=$bdVersion}
} catch {
    Write-Host "[FAIL] Beads: Not found" -ForegroundColor Red
    $tools += @{Name="Beads (bd)"; Status="FAIL"; Version="N/A"}
}

# Rclone
try {
    $rcloneVersion = (C:\rclone\rclone.exe version 2>&1 | Select-String "rclone v").ToString().Trim()
    Write-Host "[OK] Rclone: $rcloneVersion" -ForegroundColor Green
    $tools += @{Name="Rclone"; Status="OK"; Version=$rcloneVersion}
} catch {
    Write-Host "[FAIL] Rclone: Not found" -ForegroundColor Red
    $tools += @{Name="Rclone"; Status="FAIL"; Version="N/A"}
}

# Node.js
try {
    $nodeVersion = (node --version 2>&1).ToString().Trim()
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
    $tools += @{Name="Node.js"; Status="OK"; Version=$nodeVersion}
} catch {
    Write-Host "[FAIL] Node.js: Not found" -ForegroundColor Red
    $tools += @{Name="Node.js"; Status="FAIL"; Version="N/A"}
}

Write-Host ""
Write-Host "Project-based CLI Tools (via package.json):" -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exist
if (Test-Path ".\node_modules") {
    Write-Host "[OK] node_modules exists - project dependencies installed" -ForegroundColor Green
    
    # Check package.json for tools
    $packageJson = Get-Content ".\package.json" | ConvertFrom-Json
    
    $projectTools = @(
        @{Name="pnpm"; Package="packageManager"},
        @{Name="turbo"; Package="turbo"},
        @{Name="biome"; Package="@biomejs/biome"},
        @{Name="vitest"; Package="vitest"},
        @{Name="playwright"; Package="@playwright/test"},
        @{Name="ava"; Package="ava"},
        @{Name="autocannon"; Package="autocannon"},
        @{Name="prisma"; Package="prisma"}
    )
    
    foreach ($tool in $projectTools) {
        $found = $false
        $version = "N/A"
        
        # Check devDependencies
        if ($packageJson.devDependencies.PSObject.Properties.Name -contains $tool.Package) {
            $version = $packageJson.devDependencies.($tool.Package)
            $found = $true
        }
        
        # Check dependencies
        if ($packageJson.dependencies.PSObject.Properties.Name -contains $tool.Package) {
            $version = $packageJson.dependencies.($tool.Package)
            $found = $true
        }
        
        if ($found) {
            Write-Host "[OK] $($tool.Name): $version (in package.json)" -ForegroundColor Green
            $tools += @{Name=$tool.Name; Status="OK"; Version=$version}
        } else {
            Write-Host "[INFO] $($tool.Name): Not in root package.json" -ForegroundColor Yellow
            $tools += @{Name=$tool.Name; Status="INFO"; Version="Check workspace packages"}
        }
    }
} else {
    Write-Host "[WARN] node_modules not found - run 'pnpm install'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
$okCount = ($tools | Where-Object { $_.Status -eq "OK" }).Count
$totalCount = $tools.Count
Write-Host "Verified: $okCount / $totalCount tools" -ForegroundColor Green
Write-Host ""
