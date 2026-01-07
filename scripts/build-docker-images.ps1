# Build Docker images for V-EdFinance
# Usage: .\scripts\build-docker-images.ps1 [-Push]

param(
    [switch]$Push
)

$ErrorActionPreference = "Stop"

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "Building V-EdFinance Docker Images"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$REGISTRY = "luahoa"
$TAG = "staging"
$BUILD_DATE = Get-Date -Format "yyyy-MM-dd"

# Build Nginx
Write-Host "[1/4] Building Nginx image..." -ForegroundColor Yellow
docker build `
  --platform linux/amd64 `
  -t "$REGISTRY/v-edfinance-nginx:$TAG" `
  -t "$REGISTRY/v-edfinance-nginx:latest" `
  --build-arg BUILD_DATE=$BUILD_DATE `
  -f docker/nginx/Dockerfile `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Nginx build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Nginx image built successfully" -ForegroundColor Green
Write-Host ""

# Build Web
Write-Host "[2/4] Building Web image (this may take 5-7 minutes)..." -ForegroundColor Yellow
docker build `
  --platform linux/amd64 `
  -t "$REGISTRY/v-edfinance-web:$TAG" `
  -t "$REGISTRY/v-edfinance-web:latest" `
  --build-arg BUILD_DATE=$BUILD_DATE `
  -f apps/web/Dockerfile `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Web build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Web image built successfully" -ForegroundColor Green
Write-Host ""

# Build API
Write-Host "[3/4] Building API image (this may take 4-6 minutes)..." -ForegroundColor Yellow
docker build `
  --platform linux/amd64 `
  -t "$REGISTRY/v-edfinance-api:$TAG" `
  -t "$REGISTRY/v-edfinance-api:latest" `
  --build-arg BUILD_DATE=$BUILD_DATE `
  -f apps/api/Dockerfile `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: API build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ API image built successfully" -ForegroundColor Green
Write-Host ""

# List built images
Write-Host "[4/4] Listing built images..." -ForegroundColor Yellow
docker images | Select-String "v-edfinance"
Write-Host ""

# Push if flag is set
if ($Push) {
    Write-Host "========================================"  -ForegroundColor Cyan
    Write-Host "Pushing images to Docker Hub..."
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Pushing nginx:$TAG..." -ForegroundColor Yellow
    docker push "$REGISTRY/v-edfinance-nginx:$TAG"
    docker push "$REGISTRY/v-edfinance-nginx:latest"
    
    Write-Host "Pushing web:$TAG..." -ForegroundColor Yellow
    docker push "$REGISTRY/v-edfinance-web:$TAG"
    docker push "$REGISTRY/v-edfinance-web:latest"
    
    Write-Host "Pushing api:$TAG..." -ForegroundColor Yellow
    docker push "$REGISTRY/v-edfinance-api:$TAG"
    docker push "$REGISTRY/v-edfinance-api:latest"
    
    Write-Host ""
    Write-Host "✓ All images pushed successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================"  -ForegroundColor Cyan
    Write-Host "Build complete!"
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "To push images to Docker Hub, run:"
    Write-Host "  .\scripts\build-docker-images.ps1 -Push" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or push manually:"
    Write-Host "  docker push $REGISTRY/v-edfinance-nginx:$TAG"
    Write-Host "  docker push $REGISTRY/v-edfinance-web:$TAG"
    Write-Host "  docker push $REGISTRY/v-edfinance-api:$TAG"
}
