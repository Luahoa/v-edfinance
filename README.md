# V-EdFinance

**EdTech Platform for Financial Education**

## 🛡️ Zero-Debt Engineering
This project follows a strict **"Fix First, Feature Second"** protocol:
1. **Issue Check:** Use `bd ready` to identify pending tasks/bugs.
2. **Quality Audit:** Run `bd doctor` to ensure environment and dependency health.
3. **Verified Completion:** No task is closed without passing full test suites.

---

## 📚 Documentation

### Getting Started
- [AGENTS.md](./AGENTS.md) - Commands, preferences, and AI agent instructions
- [SPEC.md](./SPEC.md) - Complete technical specification
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture Decision Records (ADRs)

### Project Status & Planning
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - **Current progress review** (Updated: 2025-12-19)
- [NEXT_STEPS.md](./NEXT_STEPS.md) - Roadmap and priorities
- [TEST_COVERAGE_PLAN.md](./TEST_COVERAGE_PLAN.md) - **3-week testing implementation plan**

### Development Guides
- [DEV_SERVER_GUIDE.md](./DEV_SERVER_GUIDE.md) - Development workflow
- [TEST_ENVIRONMENT_GUIDE.md](./TEST_ENVIRONMENT_GUIDE.md) - Testing setup
- [DEBUG_SPEC.md](./DEBUG_SPEC.md) - Debugging protocols
- [E2B_ORCHESTRATION_PLAN.md](./E2B_ORCHESTRATION_PLAN.md) - Stress testing strategy

---

## 🛡️ CI/CD & Testing
[![CI](https://github.com/Luahoa/v-edfinance/actions/workflows/ci.yml/badge.svg)](https://github.com/Luahoa/v-edfinance/actions/workflows/ci.yml)
[![Tests](https://github.com/Luahoa/v-edfinance/actions/workflows/test.yml/badge.svg)](https://github.com/Luahoa/v-edfinance/actions/workflows/test.yml)
[![Quality Gates](https://github.com/Luahoa/v-edfinance/actions/workflows/quality-gates.yml/badge.svg)](https://github.com/Luahoa/v-edfinance/actions/workflows/quality-gates.yml)
[![codecov](https://codecov.io/gh/Luahoa/v-edfinance/branch/main/graph/badge.svg)](https://codecov.io/gh/Luahoa/v-edfinance)

- **Track 1 (Unit):** 100% Core Gamification Logic (AVA/Jest)
- **Track 2 (DevOps):** File Structure & Docker Health Checks (Bats)
- **Track 3 (Performance):** Stress Testing Payloads Ready (Vegeta)

---

## 📋 Prerequisites

- **Node.js** 18+ or 20+
- **pnpm** 9.15.0+ (⚠️ **REQUIRED** - Do NOT use npm or yarn)
  ```bash
  npm install -g pnpm@9.15.0
  ```
- **PostgreSQL** 15+ (for local development)

📖 See [DEPENDENCY_MANAGEMENT.md](./docs/DEPENDENCY_MANAGEMENT.md) for detailed setup instructions.

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start dev servers
pnpm dev
# Or use the convenience script:
START_DEV.bat

# Run tests
pnpm test
```

## 📊 Project Status

**Foundation:** ████████████████████ 100%  
**Backend Services:** ████████████████░░░░ 80%  
**Frontend UI:** ████░░░░░░░░░░░░░░░░ 20%  
**Testing:** ██████░░░░░░░░░░░░░░ 30%  
**Overall:** ████████████░░░░░░░░ **60%**

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for detailed progress report.

---

**Built with:** Next.js 15.1.2 • NestJS 10 • PostgreSQL 16 • Prisma • Gemini AI
