# Master Testing Plan - V-EdFinance

## 🎯 Overview
This document serves as the unified testing strategy for the V-EdFinance platform, combining security, performance, DevOps, and core logic validation.

## 🛠️ Testing Pyramid
- **E2E (5%)**: Playwright (User journeys)
- **Performance (10%)**: Vegeta (Load & Stress testing)
- **DevOps (5%)**: Bats (Shell script & Environment verification)
- **Integration (20%)**: NestJS Testing + AVA
- **Unit (60%)**: AVA (Business logic & Utilities)

## 📅 4-Week Execution Roadmap

### Week 1: Security + Bats DevOps (16h)
- [x] Task 1-5: Security Sprint (Secure Tokens, Timing Attacks, CORS, Helmet)
- [ ] Implement Bats tests for deployment & backup scripts
- [ ] Final Security Audit (PII Anonymization verification)

### Week 2: AVA Unit + Vegeta Performance (20h)
- [ ] Implement AVA tests for all services (80% coverage)
- [ ] **E2B Distributed Load Testing**: Launch 20 sandboxes with Vegeta
- [ ] Benchmark AI response times and Cache effectiveness

### Week 3: Integration + E2E (24h)
- [ ] API Integration tests with PostgreSQL (AVA/NestJS)
- [ ] **E2B Multi-Environment Matrix**: Node.js 18/20, PG 14/15/16
- [ ] Playwright E2E journeys (Auth, Course Enrollment, Wallet)

### Week 4: Security + Chaos + Production (16h)
- [ ] **E2B Chaos Engineering**: DB partition, CPU/Memory spikes
- [ ] Production hardening (Rate limiting, Budget monitoring)
- [ ] Final compliance check (OWASP Top 10)

## 🛠️ Hybrid Testing Architecture (VPS + E2B)

### 1. Role Assignment
- **VPS (103.54.153.248)**: 
    - **Staging Environment**: Real-world deployment (API: port 3000, Web: port 3001).
    - **Persistence**: PostgreSQL + Redis containers managed by Dokploy.
    - **Beads CLI**: Task & Issue tracking for bugs discovered during testing.
- **E2B (20 Concurrent Sandboxes)**: 
    - **Load Generators**: Each sandbox runs `autocannon` or `k6` to simulate high traffic.
    - **E2E Agents**: Headless Playwright workers testing the staging URL.
    - **Distributed Testing**: 160 vCPUs & 160GB RAM total capacity for massive stress tests.

### 2. Execution Flow
1. **Trigger**: Developer runs `pnpm e2b:stress` from local machine.
2. **Provision**: E2B Orchestrator spawns sandboxes.
3. **Attack**: Sandboxes hit VPS IP/Port directly (Bypassing heavy monitoring if needed).
4. **Collect**: Results aggregated from all sandboxes and saved to `STRESS_TEST_REPORT.md`.
5. **Report**: Any failures generate a `Beads` issue automatically via `bd create`.

## 🛠️ Tool Roles
| Tool | Purpose | Coverage Target |
|---|---|---|
| **AVA** | Fast, concurrent unit & integration tests | 80% |
| **Vegeta** | High-performance HTTP load testing | API Performance |
| **Bats** | Shell script & CLI verification | DevOps Quality |
| **Playwright** | Browser-based E2E journeys | Critical Flows |
| **Custom** | Security & Chaos scenarios | Resilience |
