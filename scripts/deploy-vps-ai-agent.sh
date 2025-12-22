#!/bin/bash
# VED-DRX: Deploy AI Database Architect to VPS Staging
# This script builds and deploys the AI optimization service

VPS_HOST="103.54.153.248"
VPS_USER="root"
SERVICE_NAME="v-edfinance-ai-agent"

echo "🚀 Deploying AI Database Architect to VPS..."
echo "=============================================="
echo ""

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."

# Check if pgvector is enabled
echo "   Checking pgvector extension..."
CONTAINER_ID=$(ssh ${VPS_USER}@${VPS_HOST} "docker ps --filter 'ancestor=postgres:15-alpine' --format '{{.ID}}' | head -1")

if [ -z "$CONTAINER_ID" ]; then
    echo "   ❌ PostgreSQL container not found!"
    exit 1
fi

PGVECTOR_CHECK=$(ssh ${VPS_USER}@${VPS_HOST} \
    "docker exec ${CONTAINER_ID} psql -U postgres -d vedfinance_staging -t -c \"SELECT extname FROM pg_extension WHERE extname = 'vector';\" 2>/dev/null" \
    | xargs)

if [ "$PGVECTOR_CHECK" != "vector" ]; then
    echo "   ❌ Pgvector not enabled! Run: bash scripts/enable-vps-pgvector.sh"
    exit 1
fi

echo "   ✅ Pgvector enabled"

# Check if pg_stat_statements is enabled
echo "   Checking pg_stat_statements extension..."
PG_STAT_CHECK=$(ssh ${VPS_USER}@${VPS_HOST} \
    "docker exec ${CONTAINER_ID} psql -U postgres -d vedfinance_staging -t -c \"SELECT extname FROM pg_extension WHERE extname = 'pg_stat_statements';\" 2>/dev/null" \
    | xargs)

if [ "$PG_STAT_CHECK" != "pg_stat_statements" ]; then
    echo "   ❌ pg_stat_statements not enabled! Run: bash scripts/enable-vps-pg-stat-statements.sh"
    exit 1
fi

echo "   ✅ pg_stat_statements enabled"
echo ""

# Step 2: Build Docker image locally
echo "📦 Step 2: Building AI Agent Docker image..."
docker build -f apps/api/Dockerfile.ai-agent -t ${SERVICE_NAME}:latest . || {
    echo "❌ Docker build failed!"
    exit 1
}
echo "   ✅ Image built: ${SERVICE_NAME}:latest"
echo ""

# Step 3: Save and transfer image to VPS
echo "🚚 Step 3: Transferring image to VPS..."
docker save ${SERVICE_NAME}:latest | gzip > /tmp/${SERVICE_NAME}.tar.gz
scp /tmp/${SERVICE_NAME}.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/
rm /tmp/${SERVICE_NAME}.tar.gz

echo "   ✅ Image transferred"
echo ""

# Step 4: Load image on VPS
echo "📥 Step 4: Loading image on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
gunzip < /tmp/v-edfinance-ai-agent.tar.gz | docker load
rm /tmp/v-edfinance-ai-agent.tar.gz
echo "   ✅ Image loaded on VPS"
ENDSSH

echo ""

# Step 5: Create environment file on VPS
echo "⚙️  Step 5: Configuring environment variables..."
echo "   ⚠️  Enter configuration values:"

read -p "   DATABASE_URL (staging): " DATABASE_URL
read -p "   GEMINI_API_KEY: " GEMINI_API_KEY

ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
mkdir -p /opt/v-edfinance/ai-agent
cat > /opt/v-edfinance/ai-agent/.env << 'EOF'
DATABASE_URL=${DATABASE_URL}
GEMINI_API_KEY=${GEMINI_API_KEY}
GEMINI_MODEL=gemini-1.5-flash
NODE_ENV=staging
AI_OPTIMIZATION_THRESHOLD=50
AI_OPTIMIZATION_LIMIT=20
AI_CONFIDENCE_THRESHOLD=70
EOF
chmod 600 /opt/v-edfinance/ai-agent/.env
echo "   ✅ Environment configured"
ENDSSH

echo ""

# Step 6: Deploy container
echo "🚀 Step 6: Deploying AI Agent container..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Stop existing container if running
docker stop v-edfinance-ai-agent 2>/dev/null || true
docker rm v-edfinance-ai-agent 2>/dev/null || true

# Run new container
docker run -d \
  --name v-edfinance-ai-agent \
  --restart unless-stopped \
  --network v-edfinance-network \
  --env-file /opt/v-edfinance/ai-agent/.env \
  v-edfinance-ai-agent:latest

echo "   ✅ Container deployed"
ENDSSH

echo ""

# Step 7: Verify deployment
echo "🔍 Step 7: Verifying deployment..."
sleep 5

LOGS=$(ssh ${VPS_USER}@${VPS_HOST} "docker logs v-edfinance-ai-agent --tail 20")
echo "$LOGS"

if echo "$LOGS" | grep -q "Optimization Scan Complete"; then
    echo ""
    echo "   ✅ AI Agent is running successfully!"
else
    echo ""
    echo "   ⚠️  Check logs for errors: docker logs v-edfinance-ai-agent"
fi

echo ""

# Step 8: Setup weekly cron job
echo "⏰ Step 8: Setting up weekly cron job..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Create cron job file
cat > /etc/cron.d/v-edfinance-ai-optimizer << 'EOF'
# V-EdFinance AI Database Optimizer
# Runs every Sunday at 2:00 AM
0 2 * * 0 root docker restart v-edfinance-ai-agent >> /var/log/v-edfinance-ai-agent.log 2>&1
EOF

chmod 644 /etc/cron.d/v-edfinance-ai-optimizer

# Verify cron job
crontab -l | grep -q "v-edfinance-ai-agent" || echo "   ⚠️  Cron job not in crontab"
echo "   ✅ Weekly cron job configured (Sunday 2 AM)"
ENDSSH

echo ""
echo "✅ AI Database Architect Deployment Complete!"
echo "=============================================="
echo ""
echo "📊 Summary:"
echo "   Service: ${SERVICE_NAME}"
echo "   Status: Running on VPS"
echo "   Schedule: Every Sunday at 2:00 AM"
echo "   Logs: docker logs ${SERVICE_NAME}"
echo ""
echo "📋 Next steps:"
echo "   1. Monitor first scan: ssh ${VPS_USER}@${VPS_HOST} 'docker logs -f ${SERVICE_NAME}'"
echo "   2. Check OptimizationLog table for recommendations"
echo "   3. Close beads task: ./beads.exe close ved-drx --reason \"Deployed AI Agent to VPS staging\""
