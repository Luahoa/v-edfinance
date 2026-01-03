# V-EdFinance Monitoring Scripts

## Overview

Scripts for managing and testing the V-EdFinance monitoring stack (Prometheus + Grafana).

## Scripts

### test-alerts.sh

Test and validate Prometheus alert rules.

**Usage:**
```bash
# Check all alerts
./scripts/monitoring/test-alerts.sh

# Test specific alert
./scripts/monitoring/test-alerts.sh HighErrorRate
./scripts/monitoring/test-alerts.sh HighMemoryUsage
```

**Features:**
- ✅ Validates alert rule syntax
- 🚨 Shows active alerts
- 📜 Lists all configured rules
- ⚠️  Provides simulation commands for testing

## Alert Rules

### Critical Alerts (30s evaluation)

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| **HighErrorRate** | >5% error rate | 5 minutes | Investigate API errors immediately |
| **DatabaseDown** | Database unreachable | Instant | Restore database service |
| **HighMemoryUsage** | >85% memory | 10 minutes | Scale resources or optimize |

### Warning Alerts (60s evaluation)

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| **HighCPUUsage** | >80% CPU | 15 minutes | Monitor, consider scaling |
| **DiskSpaceRunningLow** | <15% free | 5 minutes | Clean up or expand storage |
| **HighDatabaseConnections** | >80 connections | 5 minutes | Check for connection leaks |
| **SlowAPIResponse** | P95 > 2s | 10 minutes | Profile slow endpoints |

### Availability Alerts (60s evaluation)

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| **ServiceDown** | Service unreachable | 2 minutes | Restart service, check logs |
| **HighRequestLatency** | P99 > 5s | 5 minutes | Emergency performance optimization |

## Notification Channels

### Slack (Recommended)

To enable Slack notifications, configure Alertmanager:

1. Create `monitoring/alertmanager/alertmanager.yml`:
```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  receiver: 'slack-critical'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: 'slack-critical'
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'slack-critical'
    slack_configs:
      - channel: '#alerts-critical'
        title: '🚨 Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'

  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts-warnings'
        title: '⚠️ Warning Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

2. Uncomment Alertmanager in `docker-compose.monitoring.yml`
3. Uncomment alerting section in `prometheus.yml`

## Testing Alerts

### Manual Alert Testing

**High Error Rate:**
```bash
# Generate 500 errors (>5% of traffic)
for i in {1..100}; do
  curl -s http://localhost:3000/non-existent-endpoint > /dev/null
done
```

**High Memory Usage:**
```bash
# Install stress-ng
sudo apt-get install stress-ng

# Stress test memory (85%+ usage for 15 minutes)
stress-ng --vm 1 --vm-bytes 85% --timeout 15m
```

**Database Down:**
```bash
# Stop database temporarily
docker-compose stop postgres

# Alert should fire immediately
# Restart after testing
docker-compose start postgres
```

## Monitoring Access

- **Prometheus:** http://localhost:9090
  - Alerts: http://localhost:9090/alerts
  - Targets: http://localhost:9090/targets
  - Graph: http://localhost:9090/graph

- **Grafana:** http://localhost:3001
  - Default credentials: admin/admin
  - Dashboards: System Metrics, Deployment, Business

## Troubleshooting

### Alert Rules Not Loading

```bash
# Check Prometheus logs
docker logs v-edfinance-prometheus

# Validate rules manually
docker exec v-edfinance-prometheus promtool check rules /etc/prometheus/alerts.yml

# Reload Prometheus configuration
curl -X POST http://localhost:9090/-/reload
```

### Alerts Not Firing

1. Check if metrics are being scraped:
   - Visit http://localhost:9090/targets
   - All targets should be "UP"

2. Check alert evaluation:
   - Visit http://localhost:9090/alerts
   - Check "State" column (Inactive/Pending/Firing)

3. Test PromQL query directly:
   - Go to http://localhost:9090/graph
   - Execute alert expression
   - Verify it returns data

### Grafana Not Showing Data

1. Check datasource configuration:
   - Grafana → Configuration → Data Sources
   - Test connection to Prometheus

2. Verify Prometheus is accessible:
   ```bash
   curl http://prometheus:9090/api/v1/query?query=up
   ```

3. Check dashboard queries:
   - Edit panel
   - Verify PromQL syntax
   - Check time range

## Best Practices

1. **Alert Fatigue Prevention:**
   - Set appropriate thresholds
   - Use `for` durations to avoid flapping
   - Group related alerts

2. **Runbook References:**
   - Every critical alert should link to a runbook
   - Document resolution steps
   - Track incident metrics

3. **Regular Testing:**
   - Test alert rules monthly
   - Verify notification channels
   - Update thresholds based on baseline

4. **Metrics Retention:**
   - Prometheus retains 30 days by default
   - For longer retention, consider Thanos or VictoriaMetrics
   - Export important metrics to long-term storage

## References

- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)
- [PromQL Cheatsheet](https://promlabs.com/promql-cheat-sheet/)
