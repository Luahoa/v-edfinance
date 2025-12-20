#!/bin/bash
# Kamal Post-Deploy Hook
# Health checks and notifications after deployment

set -e

echo "🎉 Post-deployment tasks..."

# Wait for application to be fully ready
echo "⏳ Waiting for application startup..."
sleep 10

# Health check
echo "🏥 Running health checks..."
if curl -f -s -o /dev/null https://api.v-edfinance.com/api/health; then
  echo "✅ API is healthy"
else
  echo "⚠️ API health check failed, but deployment continued"
fi

if curl -f -s -o /dev/null https://v-edfinance.com; then
  echo "✅ Frontend is healthy"
else
  echo "⚠️ Frontend health check failed"
fi

# Send notification (optional - uncomment if using Discord)
# DEPLOYMENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
# curl -H "Content-Type: application/json" \
#   -d "{\"content\":\"🚀 **V-EdFinance deployed successfully!**\nTime: ${DEPLOYMENT_TIME}\nEnvironment: Production\"}" \
#   "${DISCORD_WEBHOOK}"

echo "✅ Deployment completed successfully! 🚀"
echo "📊 Access monitoring at: https://monitoring.v-edfinance.com"
