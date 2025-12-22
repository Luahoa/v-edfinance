#!/bin/bash

# Epic 2: Production Deployment Script
# Automated deployment to VPS with verification

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="103.54.153.248"
VPS_USER="deployer"
DOKPLOY_URL="http://localhost:3000"

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Epic 2: Production Environment Deployment      ║${NC}"
echo -e "${BLUE}║   V-EdFinance                                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Pre-flight Checks
echo -e "${YELLOW}Step 1: Pre-flight Checks${NC}"
echo "---------------------------------------------------"

# Check SSH connection
echo -n "Checking SSH connection to VPS... "
if ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_IP} "echo ok" &> /dev/null; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    echo "Error: Cannot connect to VPS. Check SSH key and network."
    exit 1
fi

# Check if dokploy.yaml exists
echo -n "Checking dokploy.yaml... "
if [ -f "dokploy.yaml" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
fi

# Check if init-db.sql exists
echo -n "Checking init-db.sql... "
if [ -f "init-db.sql" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
fi

echo ""

# Step 2: Push Configuration to Git
echo -e "${YELLOW}Step 2: Push Configuration to Git${NC}"
echo "---------------------------------------------------"

echo -n "Checking git status... "
if git diff --quiet dokploy.yaml init-db.sql; then
    echo -e "${GREEN}✓ No changes${NC}"
else
    echo -e "${YELLOW}⚠ Uncommitted changes${NC}"
    read -p "Commit and push changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add dokploy.yaml init-db.sql
        git commit -m "feat: add production environment with pgvector"
        git push origin main
        echo -e "${GREEN}✓ Pushed to main${NC}"
    else
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo ""

# Step 3: Upload Files to VPS
echo -e "${YELLOW}Step 3: Upload Configuration to VPS${NC}"
echo "---------------------------------------------------"

echo "Uploading dokploy.yaml..."
scp dokploy.yaml ${VPS_USER}@${VPS_IP}:/tmp/dokploy.yaml
echo -e "${GREEN}✓ Uploaded dokploy.yaml${NC}"

echo "Uploading init-db.sql..."
scp init-db.sql ${VPS_USER}@${VPS_IP}:/tmp/init-db.sql
echo -e "${GREEN}✓ Uploaded init-db.sql${NC}"

echo ""

# Step 4: Deploy PostgreSQL with pgvector
echo -e "${YELLOW}Step 4: Deploy PostgreSQL with pgvector${NC}"
echo "---------------------------------------------------"

echo "Stopping existing postgres container (if any)..."
ssh ${VPS_USER}@${VPS_IP} "docker stop postgres-container 2>/dev/null || true"
echo -e "${GREEN}✓ Stopped${NC}"

echo "Pulling pgvector image..."
ssh ${VPS_USER}@${VPS_IP} "docker pull pgvector/pgvector:pg17"
echo -e "${GREEN}✓ Pulled${NC}"

echo "Starting postgres with pgvector..."
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
docker run -d \
  --name postgres-container \
  --restart always \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres} \
  -e POSTGRES_DB=vedfinance \
  -v postgres_data:/var/lib/postgresql/data \
  -v /tmp/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql \
  -p 5432:5432 \
  pgvector/pgvector:pg17
EOF
echo -e "${GREEN}✓ Started${NC}"

echo "Waiting for PostgreSQL to be ready..."
sleep 10

echo "Verifying pgvector installation..."
ssh ${VPS_USER}@${VPS_IP} "docker exec postgres-container psql -U postgres -d vedfinance_prod -c 'CREATE EXTENSION IF NOT EXISTS vector; SELECT extname FROM pg_extension WHERE extname = '\''vector'\'';'" | grep vector && echo -e "${GREEN}✓ pgvector verified${NC}" || echo -e "${RED}✗ pgvector not found${NC}"

echo ""

# Step 5: Verify Databases Created
echo -e "${YELLOW}Step 5: Verify Database Initialization${NC}"
echo "---------------------------------------------------"

echo "Checking databases..."
ssh ${VPS_USER}@${VPS_IP} "docker exec postgres-container psql -U postgres -c '\l'" | grep -E "vedfinance_(dev|staging|prod)" && echo -e "${GREEN}✓ All databases created${NC}" || echo -e "${RED}✗ Database creation failed${NC}"

echo ""

# Step 6: Prompt for Manual Dokploy Configuration
echo -e "${YELLOW}Step 6: Configure Dokploy Dashboard${NC}"
echo "---------------------------------------------------"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "1. Open SSH tunnel to Dokploy:"
echo "   ${BLUE}ssh -L 3000:localhost:3000 ${VPS_USER}@${VPS_IP}${NC}"
echo ""
echo "2. Access Dokploy in browser:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "3. Add environment variables:"
echo "   - Settings → Environment Variables → Add"
echo "   - Copy secrets from password manager"
echo "   - Required variables:"
echo "     • POSTGRES_PASSWORD"
echo "     • JWT_SECRET_PROD"
echo "     • JWT_REFRESH_SECRET_PROD"
echo "     • ENCRYPTION_KEY_PROD"
echo "     • R2_ACCOUNT_ID"
echo "     • R2_ACCESS_KEY_ID"
echo "     • R2_SECRET_ACCESS_KEY"
echo "     • R2_BUCKET_NAME"
echo "     • GEMINI_API_KEY"
echo ""
echo "4. Deploy production applications:"
echo "   - Applications → api-production → Deploy"
echo "   - Applications → web-production → Deploy"
echo ""
read -p "Press Enter when Dokploy configuration is complete..."

echo ""

# Step 7: Run Prisma Migrations
echo -e "${YELLOW}Step 7: Run Prisma Migrations (Production DB)${NC}"
echo "---------------------------------------------------"

echo "Waiting for API container to be ready..."
sleep 30

echo "Running Prisma migrations..."
ssh ${VPS_USER}@${VPS_IP} "docker exec api-production-container npx prisma migrate deploy --schema=/app/apps/api/prisma/schema.prisma" && echo -e "${GREEN}✓ Migrations applied${NC}" || echo -e "${YELLOW}⚠ Container not ready or migrations failed${NC}"

echo ""

# Step 8: Smoke Tests
echo -e "${YELLOW}Step 8: Running Smoke Tests${NC}"
echo "---------------------------------------------------"

echo "Testing API health endpoint..."
curl -f -s https://api.v-edfinance.com/api/health > /dev/null && echo -e "${GREEN}✓ API responding${NC}" || echo -e "${RED}✗ API not responding${NC}"

echo "Testing Web production..."
curl -f -s -I https://v-edfinance.com | grep "200 OK" && echo -e "${GREEN}✓ Web responding${NC}" || echo -e "${RED}✗ Web not responding${NC}"

echo "Testing WWW redirect..."
curl -f -s -I https://www.v-edfinance.com | grep -E "(200|301)" && echo -e "${GREEN}✓ WWW redirect working${NC}" || echo -e "${YELLOW}⚠ WWW redirect not configured${NC}"

echo ""

# Step 9: Verify pgvector in Production
echo -e "${YELLOW}Step 9: Verify pgvector in Production Database${NC}"
echo "---------------------------------------------------"

echo "Testing vector operations..."
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
docker exec postgres-container psql -U postgres -d vedfinance_prod -c "
  CREATE TEMP TABLE test_vectors (id serial, vec vector(3));
  INSERT INTO test_vectors (vec) VALUES ('[1,2,3]');
  SELECT * FROM test_vectors WHERE vec <-> '[1,2,4]' < 2;
  DROP TABLE test_vectors;
"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ pgvector working in production${NC}"
else
    echo -e "${RED}✗ pgvector test failed${NC}"
fi

echo ""

# Step 10: Monitor Deployment
echo -e "${YELLOW}Step 10: Deployment Monitoring${NC}"
echo "---------------------------------------------------"

echo "Checking container status..."
ssh ${VPS_USER}@${VPS_IP} "docker ps --filter 'name=production' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo ""
echo "Checking resource usage..."
ssh ${VPS_USER}@${VPS_IP} "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' | grep -E '(api-production|web-production|postgres)'"

echo ""

# Final Summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Deployment Summary                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo "✅ Production Environment Deployed!"
echo ""
echo "URLs:"
echo "  • API:  https://api.v-edfinance.com/api/health"
echo "  • Web:  https://v-edfinance.com"
echo "  • WWW:  https://www.v-edfinance.com"
echo ""
echo "Monitoring:"
echo "  • Netdata:     http://${VPS_IP}:19999"
echo "  • Uptime Kuma: http://${VPS_IP}:3002"
echo ""
echo "Next Steps:"
echo "  1. Monitor logs: docker logs api-production-container"
echo "  2. Check metrics: Netdata dashboard"
echo "  3. Set up monitoring alerts"
echo "  4. Proceed to Epic 3: Monitoring Optimization"
echo ""
