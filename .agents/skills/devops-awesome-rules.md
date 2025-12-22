# DevOps Awesome Rules (Continue.dev Community)

## Mục Đích
Cung cấp AI assistant với các quy tắc DevOps chuyên sâu cho Terraform, Docker, và Kubernetes, giúp đóng gói services đồng nhất và tránh lỗi "works on my machine".

## Tech Stack Coverage
- **Terraform** - Infrastructure as Code
- **Docker** - Container packaging
- **Kubernetes** - Orchestration

## Ứng Dụng Cho V-EdFinance

### 1. Service Containerization
```yaml
# Đóng gói các services đồng nhất:
- API Backend (NestJS)
- Web Frontend (Next.js)
- AI Agent Services
- Database (PostgreSQL + pgvector)
```

### 2. Infrastructure Patterns
```hcl
# Terraform modules cho:
- VPS deployment (Dokploy)
- Database provisioning
- Monitoring stack (Grafana/Prometheus)
- Backup automation (Cloudflare R2)
```

### 3. Docker Best Practices
```dockerfile
# Multi-stage builds
# Layer caching optimization
# Security hardening
# Health checks
```

## Quy Tắc Chính

### Terraform Rules
- **Modular Structure** - Tách infrastructure thành modules tái sử dụng
- **State Management** - Remote state với locking
- **Variable Validation** - Input validation cho mọi variable
- **Output Documentation** - Rõ ràng outputs cho downstream services

### Docker Rules
- **Multi-stage Builds** - Minimize image size
- **Security Scanning** - Scan images trước khi deploy
- **Resource Limits** - Luôn set memory/CPU limits
- **Health Checks** - Implement liveness/readiness probes

### Kubernetes Rules
- **Resource Quotas** - Set limits cho namespaces
- **ConfigMaps/Secrets** - Tách config khỏi code
- **Rolling Updates** - Zero-downtime deployments
- **Monitoring Labels** - Consistent labeling cho metrics

## EdTech-Specific Adaptations

### Service Chấm Thi (AI Grading)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-grading-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: grading
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
          requests:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
```

### Service Video Bài Giảng
```yaml
# Stream optimization với CDN
# Adaptive bitrate encoding
# Caching strategy
```

### Database Scaling
```hcl
module "postgres" {
  source = "./modules/database"
  
  instance_type = "db.t3.medium"
  enable_pgvector = true
  backup_retention = 7
  multi_az = false # Cost optimization cho EdTech
}
```

## Integration với V-EdFinance Workflow

### 1. Development Flow
```bash
# Local development với Docker Compose
docker-compose -f docker-compose.yml up -d

# Test infrastructure changes
terraform plan -var-file=dev.tfvars
```

### 2. CI/CD Pipeline
```yaml
# GitHub Actions integration
- Build Docker images
- Run security scans
- Push to registry
- Deploy to VPS via Dokploy
```

### 3. Monitoring Integration
```yaml
# Prometheus metrics
# Grafana dashboards
# Alert rules cho critical services
```

## Anti-Patterns (Tránh)

❌ **Hardcoded Credentials** - Dùng secrets management
❌ **Root User** - Luôn run containers as non-root
❌ **Latest Tag** - Pin specific versions
❌ **No Resource Limits** - Có thể crash host
❌ **Single Point of Failure** - Implement redundancy

## Activation Commands

```bash
# AI assistant tự động áp dụng rules khi detect:
- Dockerfile edits
- Terraform configs
- K8s manifests
- docker-compose.yml
```

## Resources

- **Source**: Continue.dev Awesome Rules Community
- **Maintained By**: Indie dev community
- **License**: MIT
- **Integration**: `.agents/skills/` (V-EdFinance)

## Sync với Beads Tasks

Khi làm việc với DevOps tasks:
```bash
bd create "Setup Docker multi-stage build for API" --type task --priority 2
bd update ved-xxx --status in_progress

# AI assistant tự động apply Awesome Rules
# Verify với rules checklist trước khi close task
```

---

**📌 Skill Context**: AI hiểu infrastructure patterns để tránh lỗi deployment và đảm bảo consistency across environments.
