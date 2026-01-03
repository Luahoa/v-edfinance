# E2B Testing Strategy - V-EdFinance

## 💰 Budget Allocation ($100 Credit)
- **Distributed Load Testing**: $5-15
- **Chaos Engineering**: $4-12
- **Multi-Environment**: $9-27
- **CI/CD Parallelization**: $12-38
- **Reserve**: $30

## 🎯 Key Use Cases

### 1. Distributed Load Testing (Vegeta)
- **Scale**: 20 sandboxes × 50 users = 1000 concurrent users.
- **Goal**: Test real production capacity and AI response latency.

### 2. Chaos Engineering
- **Scenarios**: DB network partition, Memory leaks, CPU spikes.
- **Goal**: Verify system resilience in isolated environments.

### 3. Multi-Environment Matrix
- **Matrix**: Node.js (18, 20) x PostgreSQL (14, 15, 16).
- **Goal**: Ensure compatibility across different infrastructure versions.

### 4. AI Load Testing
- **Scale**: 1000 concurrent AI chat requests.
- **Goal**: Validate cache effectiveness and cost tracking per request.

## 🏗️ Sandbox Specs
- 20 concurrent sandboxes.
- 8 vCPUs, 8GB RAM, 10GB disk each.
- 1 hour session length.

## 🔑 Configuration
- API Key: `e2b_ec524b95bd0d195e79d49811f364c5f2d083d7df`
