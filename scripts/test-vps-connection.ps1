# Quick VPS Connection Test
param(
    [string]$VPSHost = "103.54.153.248",
    [string]$VPSUser = "root"
)

Write-Host "Testing VPS Connection..." -ForegroundColor Cyan
Write-Host "Target: $VPSUser@$VPSHost" -ForegroundColor Yellow
Write-Host ""

# Test 1: Ping
Write-Host "1. Testing network connectivity..." -ForegroundColor Green
$pingResult = Test-Connection -ComputerName $VPSHost -Count 2 -Quiet
if ($pingResult) {
    Write-Host "   OK VPS is reachable" -ForegroundColor Green
} else {
    Write-Host "   FAIL VPS not reachable" -ForegroundColor Red
    exit 1
}

# Test 2: SSH port
Write-Host "2. Testing SSH port 22..." -ForegroundColor Green
$tcpTest = Test-NetConnection -ComputerName $VPSHost -Port 22 -WarningAction SilentlyContinue
if ($tcpTest.TcpTestSucceeded) {
    Write-Host "   OK Port 22 is open" -ForegroundColor Green
} else {
    Write-Host "   FAIL Port 22 is closed/blocked" -ForegroundColor Red
    exit 1
}

# Test 3: API port
Write-Host "3. Testing API port 3001..." -ForegroundColor Green
$apiTest = Test-NetConnection -ComputerName $VPSHost -Port 3001 -WarningAction SilentlyContinue
if ($apiTest.TcpTestSucceeded) {
    Write-Host "   OK Port 3001 is open" -ForegroundColor Green
} else {
    Write-Host "   WARN Port 3001 is closed (API may not be running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Connection Status: READY" -ForegroundColor Green
Write-Host ""
Write-Host "Try manual SSH:" -ForegroundColor Cyan
Write-Host "   ssh $VPSUser@$VPSHost" -ForegroundColor White
Write-Host ""
