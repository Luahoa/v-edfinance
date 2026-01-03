#!/bin/bash
# Test Alert Firing - V-EdFinance Monitoring Stack
# Usage: ./test-alerts.sh [alert-name]

set -e

PROMETHEUS_URL="http://localhost:9090"
ALERT_NAME="${1:-all}"

echo "🔍 Testing V-EdFinance Alert Rules..."
echo "Prometheus URL: $PROMETHEUS_URL"
echo ""

# Function to check if Prometheus is running
check_prometheus() {
  if ! curl -s "$PROMETHEUS_URL/-/healthy" > /dev/null; then
    echo "❌ Prometheus is not running at $PROMETHEUS_URL"
    echo "   Start it with: docker-compose -f docker-compose.monitoring.yml up -d prometheus"
    exit 1
  fi
  echo "✅ Prometheus is running"
}

# Function to validate alert rules
validate_rules() {
  echo ""
  echo "📋 Validating alert rules configuration..."
  
  if docker exec v-edfinance-prometheus promtool check rules /etc/prometheus/alerts.yml; then
    echo "✅ Alert rules are valid"
  else
    echo "❌ Alert rules have syntax errors"
    exit 1
  fi
}

# Function to show active alerts
show_active_alerts() {
  echo ""
  echo "🚨 Active Alerts:"
  echo ""
  
  ALERTS=$(curl -s "$PROMETHEUS_URL/api/v1/alerts" | jq -r '.data.alerts[] | "[\(.labels.severity)] \(.labels.alertname): \(.state)"')
  
  if [ -z "$ALERTS" ]; then
    echo "   No active alerts (system is healthy)"
  else
    echo "$ALERTS"
  fi
}

# Function to show alert rules
show_rules() {
  echo ""
  echo "📜 Configured Alert Rules:"
  echo ""
  
  curl -s "$PROMETHEUS_URL/api/v1/rules" | jq -r '.data.groups[] | .name as $group | .rules[] | "\($group): \(.alert) (\(.labels.severity))"'
}

# Function to simulate high error rate
simulate_high_error_rate() {
  echo ""
  echo "⚠️  Simulating high error rate (5% threshold)..."
  echo "   This would require sending 500 errors to the API"
  echo "   Use: for i in {1..100}; do curl http://localhost:3000/non-existent; done"
}

# Function to simulate high memory
simulate_high_memory() {
  echo ""
  echo "⚠️  Simulating high memory usage (85% threshold)..."
  echo "   This would require a stress test"
  echo "   Use: stress-ng --vm 1 --vm-bytes 85% --timeout 15m"
}

# Main execution
check_prometheus
validate_rules
show_rules
show_active_alerts

case $ALERT_NAME in
  "HighErrorRate")
    simulate_high_error_rate
    ;;
  "HighMemoryUsage")
    simulate_high_memory
    ;;
  *)
    echo ""
    echo "💡 To test specific alerts:"
    echo "   ./test-alerts.sh HighErrorRate"
    echo "   ./test-alerts.sh HighMemoryUsage"
    ;;
esac

echo ""
echo "🎯 View Prometheus Alerts: $PROMETHEUS_URL/alerts"
echo "🎯 View Grafana Dashboards: http://localhost:3001"
echo ""
