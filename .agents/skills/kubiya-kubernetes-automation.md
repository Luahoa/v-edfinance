# Kubiya AI - Kubernetes Automation Skills

## Mục Đích
AI-powered Kubernetes automation với natural language interface. Cho phép quản lý K8s clusters qua conversation, tự động generate manifests, troubleshoot issues, và optimize resource allocation.

## Core Capabilities

### 1. Natural Language to K8s Manifests
```typescript
// User: "Deploy the API service to production with 3 replicas"
// AI generates:

apiVersion: apps/v1
kind: Deployment
metadata:
  name: v-edfinance-api
  namespace: production
  labels:
    app: api
    tier: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
        version: v2.0.0
    spec:
      containers:
      - name: api
        image: ghcr.io/luahoa/v-edfinance-api:v2.0.0
        ports:
        - containerPort: 3001
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: connection-string
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
  namespace: production
spec:
  selector:
    app: api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
```

### 2. Intelligent Troubleshooting
```typescript
// User: "API pods keep crashing, help me debug"
// AI executes diagnostic workflow:

class KubernetesDebugger {
  async diagnoseApiCrash() {
    // Step 1: Get pod status
    const pods = await kubectl("get pods -l app=api -o json");
    const crashingPods = pods.items.filter(p => 
      p.status.containerStatuses?.[0]?.restartCount > 3
    );
    
    // Step 2: Analyze logs
    for (const pod of crashingPods) {
      const logs = await kubectl(`logs ${pod.metadata.name} --tail=100`);
      const errorPattern = this.extractErrorPatterns(logs);
      
      // AI reasoning
      if (errorPattern.includes('ECONNREFUSED')) {
        return {
          issue: 'Database connection failure',
          cause: 'DATABASE_URL secret might be incorrect or DB is down',
          remedy: [
            'Verify postgres-credentials secret',
            'Check if database pod is running',
            'Test connection from debug pod'
          ]
        };
      }
      
      if (errorPattern.includes('OOMKilled')) {
        return {
          issue: 'Out of memory',
          cause: 'Memory limit too low for workload',
          remedy: [
            'Increase memory limit to 2Gi',
            'Analyze memory leak with profiler',
            'Check for memory-intensive queries'
          ]
        };
      }
    }
    
    // Step 3: Check events
    const events = await kubectl("get events --sort-by=.metadata.creationTimestamp");
    return this.analyzeEvents(events);
  }
}
```

### 3. Resource Optimization
```typescript
// User: "Optimize resource usage for production namespace"
// AI analyzes and recommends:

class K8sResourceOptimizer {
  async optimizeNamespace(namespace: string) {
    // Collect metrics (last 7 days)
    const metrics = await this.fetchMetrics(namespace, '7d');
    
    // Analyze each deployment
    const recommendations = [];
    
    for (const deployment of metrics.deployments) {
      const usage = deployment.resourceUsage;
      const limits = deployment.resourceLimits;
      
      // CPU over-provisioned
      if (usage.cpu.p95 < limits.cpu * 0.5) {
        recommendations.push({
          resource: deployment.name,
          type: 'cpu',
          current: limits.cpu,
          recommended: Math.ceil(usage.cpu.p95 * 1.2), // 20% buffer
          savings: this.calculateSavings(limits.cpu, usage.cpu.p95 * 1.2)
        });
      }
      
      // Memory under-provisioned
      if (usage.memory.p95 > limits.memory * 0.85) {
        recommendations.push({
          resource: deployment.name,
          type: 'memory',
          current: limits.memory,
          recommended: Math.ceil(usage.memory.p95 * 1.3), // 30% buffer
          reason: 'Prevent OOMKills'
        });
      }
      
      // Replica count optimization
      const avgCpuPerPod = usage.cpu.avg / deployment.replicas;
      const optimalReplicas = Math.ceil(usage.cpu.p95 / (limits.cpu * 0.7));
      
      if (optimalReplicas !== deployment.replicas) {
        recommendations.push({
          resource: deployment.name,
          type: 'replicas',
          current: deployment.replicas,
          recommended: optimalReplicas,
          reasoning: 'Better load distribution'
        });
      }
    }
    
    return {
      totalSavings: recommendations.reduce((sum, r) => sum + (r.savings || 0), 0),
      recommendations,
      autoApplicable: recommendations.filter(r => r.confidence > 90)
    };
  }
}
```

### 4. Auto-Scaling Configuration
```yaml
# User: "Setup autoscaling for API service based on CPU and request rate"
# AI generates:

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: v-edfinance-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max

---
apiVersion: v1
kind: Service
metadata:
  name: api-metrics
  namespace: production
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3001"
    prometheus.io/path: "/metrics"
spec:
  selector:
    app: api
  ports:
  - name: metrics
    port: 3001
```

### 5. Security Hardening
```typescript
// User: "Harden security for all production workloads"
// AI applies best practices:

class K8sSecurityHardener {
  async hardenNamespace(namespace: string) {
    // 1. NetworkPolicy - Zero-trust networking
    await this.applyNetworkPolicies(namespace, {
      defaultDeny: true,
      allowedIngress: [
        { from: 'ingress-nginx', to: 'web', port: 3000 },
        { from: 'web', to: 'api', port: 3001 },
        { from: 'api', to: 'postgres', port: 5432 }
      ],
      allowedEgress: [
        { to: 'external-apis', port: 443 },
        { to: 'cloudflare-r2', port: 443 }
      ]
    });
    
    // 2. PodSecurityPolicy
    await this.applyPSP(namespace, {
      runAsNonRoot: true,
      readOnlyRootFilesystem: true,
      allowPrivilegeEscalation: false,
      capabilities: {
        drop: ['ALL'],
        add: ['NET_BIND_SERVICE'] // Only for port 80/443
      }
    });
    
    // 3. Resource Quotas
    await this.applyResourceQuota(namespace, {
      'requests.cpu': '10',
      'requests.memory': '20Gi',
      'limits.cpu': '20',
      'limits.memory': '40Gi',
      'persistentvolumeclaims': '10'
    });
    
    // 4. Secrets Management
    await this.rotateSecrets(namespace);
    await this.enableSecretsEncryption();
    
    // 5. Image Security
    await this.enforceTrustedRegistries([
      'ghcr.io/luahoa/*',
      'docker.io/library/postgres:17-alpine'
    ]);
    
    return {
      networkPolicies: 3,
      pspApplied: true,
      quotasEnforced: true,
      secretsRotated: true,
      imageSigningRequired: true
    };
  }
}
```

## V-EdFinance Kubernetes Migration (Future)

### Current State: Dokploy (Lightweight)
```yaml
# docker-compose.yml (current)
services:
  api:
    image: ghcr.io/luahoa/v-edfinance-api:latest
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

### Future State: Kubernetes (Scalable)
```yaml
# Kubiya AI helps migrate to K8s when needed
# User: "Migrate our Dokploy setup to Kubernetes"

# AI generates full K8s stack:
apiVersion: v1
kind: Namespace
metadata:
  name: v-edfinance
---
# API Deployment (from docker-compose)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: v-edfinance
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    spec:
      containers:
      - name: api
        image: ghcr.io/luahoa/v-edfinance-api:latest
        # ... (full spec)
---
# Database (StatefulSet with persistence)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: v-edfinance
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    spec:
      containers:
      - name: postgres
        image: pgvector/pgvector:pg17
        # ... (pgvector extension)
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
---
# Ingress (replace Dokploy routing)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: v-edfinance-ingress
  namespace: v-edfinance
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.v-edfinance.com
    secretName: api-tls
  rules:
  - host: api.v-edfinance.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

## Kubiya Conversational Commands

```typescript
// Natural language commands supported:
const KUBIYA_COMMANDS = {
  // Deployment
  "Deploy API v2.1.0 to staging": async () => {
    await kubectl.set.image('deployment/api', 'api=ghcr.io/luahoa/v-edfinance-api:v2.1.0');
    await kubectl.rollout.status('deployment/api');
  },
  
  // Scaling
  "Scale web service to 5 replicas": async () => {
    await kubectl.scale('deployment/web', '--replicas=5');
  },
  
  // Debugging
  "Show me logs for failed API pods": async () => {
    const pods = await kubectl.get('pods', '-l app=api --field-selector=status.phase=Failed');
    for (const pod of pods) {
      console.log(await kubectl.logs(pod.name, '--previous'));
    }
  },
  
  // Resource management
  "What's consuming most memory in production?": async () => {
    const metrics = await kubectl.top('pods', '-n production --sort-by=memory');
    return metrics.slice(0, 10);
  },
  
  // Security
  "List all pods running as root": async () => {
    const pods = await kubectl.get('pods', '-o json --all-namespaces');
    return pods.items.filter(p => 
      p.spec.securityContext?.runAsUser === 0 ||
      !p.spec.securityContext?.runAsNonRoot
    );
  }
};
```

## Grafana + Kubiya Integration

```typescript
// AI connects K8s metrics to Grafana dashboards
class KubiyaGrafanaIntegration {
  async setupMonitoring() {
    // 1. Create ServiceMonitor for Prometheus
    await this.createServiceMonitor({
      name: 'v-edfinance-metrics',
      endpoints: [
        { port: 'metrics', path: '/metrics', interval: '30s' }
      ]
    });
    
    // 2. Generate Grafana dashboard JSON
    const dashboard = await this.generateDashboard({
      title: 'V-EdFinance Kubernetes Overview',
      panels: [
        { type: 'graph', metric: 'container_cpu_usage_seconds_total' },
        { type: 'graph', metric: 'container_memory_working_set_bytes' },
        { type: 'table', metric: 'kube_pod_status_phase' },
        { type: 'heatmap', metric: 'http_request_duration_seconds' }
      ]
    });
    
    // 3. Setup alerts
    await this.createPrometheusRules([
      {
        alert: 'HighPodRestartRate',
        expr: 'rate(kube_pod_container_status_restarts_total[15m]) > 0.1',
        for: '5m',
        annotations: {
          summary: 'Pod {{ $labels.pod }} is restarting frequently'
        }
      },
      {
        alert: 'HighMemoryUsage',
        expr: 'container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9',
        for: '10m',
        annotations: {
          summary: 'Container {{ $labels.container }} memory usage > 90%'
        }
      }
    ]);
  }
}
```

## Beads Integration

```bash
# Kubiya tự động tạo tasks cho K8s operations
kubiya: "Deploy API to production requires approval"

# AI creates beads task:
bd create "Production deployment: API v2.1.0" \
  --type deployment \
  --priority 1 \
  --deps "ved-abc,ved-def" # Tests passed, security scan clean

# AI waits for approval:
bd update ved-xyz --status pending_approval

# After approval:
bd update ved-xyz --status in_progress
kubectl apply -f k8s/production/api-deployment.yaml
kubectl rollout status deployment/api -w

# Success:
bd close ved-xyz --reason "Deployed successfully. Health checks passed."
```

## Migration Roadmap (Dokploy → K8s)

```yaml
phase_1: "Stay on Dokploy (Current)"
  reasons:
    - Simpler for MVP stage
    - Lower operational overhead
    - Sufficient for <10k users
    
phase_2: "K8s Migration (When needed)"
  triggers:
    - Traffic > 100k requests/day
    - Need multi-region deployment
    - Advanced autoscaling requirements
    - Team grows > 5 engineers
  
  migration_plan:
    - Setup K8s cluster (managed service: GKE/EKS)
    - Use Kubiya AI to generate manifests from docker-compose
    - Migrate staging environment first
    - Run parallel production (Dokploy + K8s) for 2 weeks
    - Full cutover with rollback plan
```

---

**📌 Skill Context**: AI hoạt động như Kubernetes admin với natural language interface, sẵn sàng migrate V-EdFinance khi scale demands it. Hiện tại pre-loaded context cho future K8s adoption.
