#!/bin/bash
# Build Docker images locally for V-EdFinance
# Usage: bash scripts/build-docker-images.sh [--push]

set -e

echo "========================================"
echo "Building V-EdFinance Docker Images"
echo "========================================"
echo ""

# Configuration
REGISTRY="luahoa"
TAG="staging"
BUILD_DATE=$(date +%Y-%m-%d)

echo "[1/4] Building Nginx image..."
docker build \
  --platform linux/amd64 \
  -t ${REGISTRY}/v-edfinance-nginx:${TAG} \
  -t ${REGISTRY}/v-edfinance-nginx:latest \
  --build-arg BUILD_DATE=${BUILD_DATE} \
  -f docker/nginx/Dockerfile \
  .

echo "✓ Nginx image built successfully"
echo ""

echo "[2/4] Building Web image..."
docker build \
  --platform linux/amd64 \
  -t ${REGISTRY}/v-edfinance-web:${TAG} \
  -t ${REGISTRY}/v-edfinance-web:latest \
  --build-arg BUILD_DATE=${BUILD_DATE} \
  -f apps/web/Dockerfile \
  .

echo "✓ Web image built successfully"
echo ""

echo "[3/4] Building API image..."
docker build \
  --platform linux/amd64 \
  -t ${REGISTRY}/v-edfinance-api:${TAG} \
  -t ${REGISTRY}/v-edfinance-api:latest \
  --build-arg BUILD_DATE=${BUILD_DATE} \
  -f apps/api/Dockerfile \
  .

echo "✓ API image built successfully"
echo ""

echo "[4/4] Listing built images..."
docker images | grep "v-edfinance"
echo ""

# Check if --push flag is present
if [[ "$1" == "--push" ]]; then
    echo "========================================"
    echo "Pushing images to Docker Hub..."
    echo "========================================"
    echo ""
    
    echo "Pushing nginx:${TAG}..."
    docker push ${REGISTRY}/v-edfinance-nginx:${TAG}
    docker push ${REGISTRY}/v-edfinance-nginx:latest
    
    echo "Pushing web:${TAG}..."
    docker push ${REGISTRY}/v-edfinance-web:${TAG}
    docker push ${REGISTRY}/v-edfinance-web:latest
    
    echo "Pushing api:${TAG}..."
    docker push ${REGISTRY}/v-edfinance-api:${TAG}
    docker push ${REGISTRY}/v-edfinance-api:latest
    
    echo ""
    echo "✓ All images pushed successfully"
else
    echo ""
    echo "========================================"
    echo "Build complete!"
    echo "========================================"
    echo "To push images to Docker Hub, run:"
    echo "  bash scripts/build-docker-images.sh --push"
    echo ""
    echo "Or push manually:"
    echo "  docker push ${REGISTRY}/v-edfinance-nginx:${TAG}"
    echo "  docker push ${REGISTRY}/v-edfinance-web:${TAG}"
    echo "  docker push ${REGISTRY}/v-edfinance-api:${TAG}"
fi
