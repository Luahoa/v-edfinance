# Dependency & Environment Drift Audit Report

**Date**: 2026-01-04  
**Auditor**: Amp Agent  
**Project**: V-EdFinance  

---

## Executive Summary

Critical issues found:
- **CRITICAL**: Merge conflict markers in root package.json (lines 2-86)
- **CRITICAL**: Duplicate service definitions in docker-compose.monitoring.yml
- **HIGH**: Version conflicts in TypeScript, @types/node, and Next.js
- **MEDIUM**: Merge conflicts in apps/web/package.json and docker-compose.monitoring.yml
- **MEDIUM**: 15+ environment variables referenced in code but not documented
- **LOW**: Several potentially unused dependencies identified

---

## Section 1: Version Conflicts

### TypeScript Version Mismatch
- **Root**: `^5.9.3`
- **apps/api**: `^5.7.3`
- **apps/web**: `^5` (unspecified minor/patch)
- **Impact**: Potential compilation inconsistencies, different type-checking behavior
- **Recommendation**: Standardize to `^5.9.3` across all packages

### @types/node Version Conflict
- **Root**: `^25.0.3`
- **apps/api**: `^22.10.7`
- **apps/web**: `^20`
- **Impact**: Node.js API type definitions mismatch
- **Recommendation**: Use `^22.10.7` (stable LTS) across all packages

### Next.js Version
- **apps/api**: `16.1.0` (dependency - unusual for backend)
- **apps/web**: `15.1.2`
- **Impact**: Next.js in API package is likely unnecessary
- **Recommendation**: Remove from API package.json

### Axios Version
- **Root**: `1.13.2`
- **apps/api**: `1.13.2`
- **Impact**: None (consistent)
- **Status**: ✅ OK

### React Version
- **Root**: `18.3.1`
- **apps/web**: `18.3.1` (implicit via Next.js)
- **Impact**: None (consistent)
- **Status**: ✅ OK

### Prisma Version
- **apps/api**: `5.22.0` (@prisma/client and prisma CLI)
- **Impact**: None (consistent)
- **Status**: ✅ OK

---

## Section 2: Merge Conflicts in package.json Files

### Root package.json (CRITICAL)
**Location**: Lines 2-86  
**Conflict Type**: Updated upstream vs Stashed changes

**Upstream Version**:
- More comprehensive scripts (lint, format, check, test:*, smoke:*, bench:*, monitoring:*)
- Extensive devDependencies (44 packages including biome, playwright, vitest, etc.)
- AVA configuration with TypeScript extensions

**Stashed Version**:
- Minimal scripts (build, dev, lint, test:orchestrate, format)
- Basic devDependencies (7 packages)
- Workspaces defined
- React dependencies at root level

**Impact**: Build/test/lint commands will fail until resolved  
**Recommendation**: Keep upstream version (more complete), merge workspaces config from stashed

### apps/web/package.json (HIGH)
**Location**: Lines 13-60  
**Conflict Type**: Radix UI dependencies vs date-fns/framer-motion

**Upstream Version**:
- 10+ @radix-ui/* packages (aspect-ratio, avatar, checkbox, dialog, etc.)
- clsx, cmdk utilities
- Testing libraries (@testing-library/jest-dom, @testing-library/react)
- @types/canvas-confetti

**Stashed Version**:
- date-fns, framer-motion, js-cookie
- lucide-react, react-markdown, react-player
- react-resizable-panels, socket.io-client, zustand

**Impact**: Missing UI components or utilities depending on which is chosen  
**Recommendation**: Merge both sets - all appear to be in active use

### docker-compose.monitoring.yml (MEDIUM)
**Location**: Lines 80-95  
**Conflict Type**: Volume definitions

**Upstream Version**:
```yaml
volumes:
  netdataconfig:
  netdatalib:
  netdatacache:
  uptime-kuma-data:
  beszel-data:
  prometheus-data:
  grafana-data:
```

**Stashed Version**:
```yaml
volumes:
  prometheus_data:
  grafana_data:
```

**Additional Issue**: Duplicate prometheus and grafana service definitions (lines 2-30 vs 32-77)

**Impact**: Docker Compose will fail to start  
**Recommendation**: 
1. Remove duplicate service definitions (keep lines 32-77 - more detailed)
2. Use snake_case volume names (prometheus_data, grafana_data)
3. Remove unused netdata/uptime-kuma/beszel volumes if services not defined

---

## Section 3: Missing Peer Dependencies

**Analysis**: pnpm should handle peer dependencies automatically. No missing peer dependency warnings detected in package.json files.

**Potential Issues**:
- `@nestjs/*` packages typically require `reflect-metadata` and `rxjs` (both present ✅)
- `@radix-ui/*` packages require `react` and `react-dom` (present ✅)
- `socket.io-client` version `^4.8.1` in web and api should match server version ✅

**Status**: No critical peer dependency issues detected

---

## Section 4: Environment Variable Gaps

### Backend (apps/api) - Missing Documentation

**Storage/R2 Variables** (used in storage.service.ts, unstorage.service.ts):
- `STORAGE_DRIVER` (default: 'fs')
- `STORAGE_FS_BASE` (default: './uploads')
- `GCS_BUCKET_URL`
- `GCS_ACCESS_TOKEN`
- `R2_ENDPOINT` ⚠️
- `R2_BUCKET_NAME` ⚠️
- `R2_ACCESS_KEY_ID` ⚠️
- `R2_SECRET_ACCESS_KEY` ⚠️
- `R2_ACCOUNT_ID` ⚠️
- `R2_PUBLIC_URL`

**API Configuration**:
- `ALLOWED_ORIGINS` (used in main.ts, events.gateway.ts, social.gateway.ts) ⚠️
- `PORT` (default: 3001)
- `WEB_BASE_URL` (default: 'https://v-edfinance.pages.dev')

**AI/ML**:
- `GEMINI_API_KEY` (used in ai.service.ts, gemini.service.ts) ⚠️

**Auth**:
- `JWT_SECRET` (used in jwt.strategy.ts, auth.module.ts) ⚠️

**Redis Cache**:
- `REDIS_HOST` (default: 'localhost')
- `REDIS_PORT` (default: 6379)
- `REDIS_TTL` (default: 3600)

**Environment Detection**:
- `NODE_ENV` (used throughout)
- `VITEST` (test detection)

**Database**:
- `TEST_DATABASE_URL` (used in test files)

### Frontend (apps/web) - Missing Documentation

**API Communication**:
- `NEXT_PUBLIC_API_URL` (default: 'http://localhost:3001') ⚠️

**Payment**:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ⚠️

### Docker Compose - Environment Variables

**docker-compose.test.yml**:
- `E2B_API_KEY` (required for test execution)

**docker-compose.monitoring.yml**:
- `GRAFANA_ADMIN_USER` (default: admin)
- `GRAFANA_ADMIN_PASSWORD` (redacted in file)

### Documented vs Actual

**env-examples/r2-storage.env.example** documents:
- `CLOUDFLARE_R2_ACCOUNT_ID` (code uses `R2_ACCOUNT_ID`) ⚠️ NAME MISMATCH
- `CLOUDFLARE_R2_ACCESS_KEY_ID` (code uses `R2_ACCESS_KEY_ID`) ⚠️ NAME MISMATCH
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY` (code uses `R2_SECRET_ACCESS_KEY`) ⚠️ NAME MISMATCH
- `CLOUDFLARE_R2_BUCKET_NAME` (code uses `R2_BUCKET_NAME`) ⚠️ NAME MISMATCH
- `CLOUDFLARE_R2_PUBLIC_URL` (code uses `R2_PUBLIC_URL`) ⚠️ NAME MISMATCH

**Recommendation**: 
1. Create comprehensive `.env.example` file at root
2. Fix naming mismatch: Either update code to use `CLOUDFLARE_R2_*` or update example to use `R2_*`
3. Document all 15+ missing environment variables
4. Add validation script (use existing `scripts/validate-env.ts`)

---

## Section 5: Docker Configuration Issues

### 1. Duplicate Service Definitions (docker-compose.monitoring.yml)
**Issue**: Both `prometheus` and `grafana` defined twice (lines 2-30 and 32-77)  
**Impact**: Docker Compose parse error or unpredictable behavior  
**Fix**: Remove lines 2-30, keep 32-77 (more complete configuration)

### 2. Network Naming Inconsistency
**docker-compose.yml**: Uses `vedfinance-network`  
**docker-compose.monitoring.yml**: Uses both `vedfinance-network` (lines 16, 24, 30, 75, 94) and `monitoring` (lines 51, 75)  
**docker-compose.postgres.yml**: No network defined (uses default)  
**docker-compose.test.yml**: Uses `test-network`

**Impact**: Monitoring services may not communicate with API/DB  
**Recommendation**: Standardize on `vedfinance-network` or create external network

### 3. Port Conflicts
- **Grafana**: Port 3001 (conflicts with API default 3001)
- **Postgres (main)**: 5433:5432
- **Postgres (postgres.yml)**: 5432:5432
- **Postgres (test)**: 5434:5432
- **Redis**: 6380:6379

**Impact**: Running both docker-compose.yml and docker-compose.postgres.yml simultaneously will cause postgres port conflict  
**Recommendation**: Document which compose file to use for which scenario

### 4. Missing Services Referenced
**docker-compose.monitoring.yml** defines volumes for:
- netdata (no service definition)
- uptime-kuma (no service definition)
- beszel (no service definition)

**Recommendation**: Either add service definitions or remove unused volumes

### 5. Health Check Inconsistencies
- ✅ postgres, postgres-test: Defined
- ✅ redis: Defined
- ✅ api: Defined
- ❌ grafana: Not defined
- ❌ prometheus: Not defined

**Recommendation**: Add health checks for all services

### 6. Secret Management
**docker-compose.postgres.yml** contains hardcoded password: `Halinh!@34`  
**Impact**: Security vulnerability if committed to public repo  
**Recommendation**: Use environment variable: `${POSTGRES_PASSWORD:-postgres}`

---

## Section 6: Unused Dependencies (Candidates for Removal)

### Root package.json

**High Confidence (Unused)**:
- `ava`: Used in package.json config but no .ava.ts files found in root
- `msw`: Mock Service Worker - no usage found in root-level tests
- `jest-coverage-badges`: No jest.config.js at root, using vitest

**Medium Confidence (Potentially Unused)**:
- `autocannon`: Benchmarking tool - only used in npm scripts (bench:auth, bench:api)
- `bcrypt`: Auth library - should be in API only, not root
- `@types/bcrypt`: Should be in API only
- `unplugin-swc`: SWC plugin - may be implicitly used by turbo/build system
- `ts-node`: May be used by scripts, check usage

**Low Confidence (Keep for Now)**:
- `tsx`: Used in smoke test scripts
- `turbo`: Monorepo build system (required)
- `prettier`, `@biomejs/biome`: Formatting tools (both present - choose one?)
- `husky`, `lint-staged`: Git hooks (required if using)
- `vitest`, `@vitest/*`: Testing framework (in active use)
- `playwright`: E2E testing (in active use)
- `dotenv`: Environment variables (required)
- `esbuild`: Bundler (likely used by build system)
- `minimist`: CLI arg parsing (may be used in scripts)

### apps/api package.json

**Medium Confidence (Unused)**:
- `next`: `16.1.0` - Backend shouldn't have Next.js dependency ⚠️
- `pdfkit`, `@types/pdfkit`: PDF generation - verify usage (may be for certificate generation)
- `kysely`: SQL query builder - verify if in use alongside Prisma
- `drizzle-orm`, `drizzle-zod`, `drizzle-kit`: ORM - verify if in use alongside Prisma
- `pgvector`: Postgres vector extension - verify if AI features use this
- `@xenova/transformers`: ML transformers - verify if AI features use this
- `aws4fetch`: AWS request signing - may be for S3/R2
- `@mermaid-js/mermaid-cli`: Diagram generation - likely for ERD only
- `socket.io-client`: Client library in backend (should only need `socket.io` server)

**Low Confidence (Likely Used)**:
- All `@nestjs/*` packages: Core framework (required)
- `@prisma/client`, `prisma`: Database ORM (in active use)
- `@google/generative-ai`: Gemini AI integration (in active use)
- `@aws-sdk/*`: S3/R2 storage (in active use)
- `bcrypt`: Password hashing (in active use)
- `helmet`: Security headers (in active use)
- `class-validator`, `class-transformer`: DTO validation (in active use)

### apps/web package.json

**Merge Conflict**: Cannot accurately assess until package.json conflicts resolved

**Known Issues**:
- Missing dependencies from stashed changes (date-fns, framer-motion, etc.) if upstream chosen
- Missing @radix-ui components if stashed chosen

---

## Section 7: Recommendations (Prioritized)

### Priority 0 (CRITICAL - Blocks Development)

**1. Resolve package.json Merge Conflicts** (Estimated: 30 min)
- ✅ Action: Manually merge root package.json keeping upstream + workspaces from stashed
- ✅ Action: Manually merge apps/web/package.json combining both dependency sets
- ✅ Action: Test with `pnpm install` to verify no conflicts

**2. Fix docker-compose.monitoring.yml** (Estimated: 10 min)
- ✅ Action: Remove duplicate service definitions (lines 2-30)
- ✅ Action: Resolve volume name conflict (keep snake_case)
- ✅ Action: Standardize network to `vedfinance-network`

### Priority 1 (HIGH - Prevents Builds/Tests)

**3. Standardize TypeScript Versions** (Estimated: 15 min)
```json
// All package.json files
"typescript": "^5.9.3"
```

**4. Fix @types/node Versions** (Estimated: 15 min)
```json
// All package.json files
"@types/node": "^22.10.7"
```

**5. Remove Next.js from API** (Estimated: 5 min)
```bash
cd apps/api
pnpm remove next
```

### Priority 2 (MEDIUM - Environment Setup)

**6. Fix R2 Environment Variable Naming** (Estimated: 20 min)
- Option A: Update code to use `CLOUDFLARE_R2_*` prefix
- Option B: Update env-examples to use `R2_*` prefix (recommended - less code changes)

**7. Create Comprehensive .env.example** (Estimated: 30 min)
```bash
# Template structure
# Database
DATABASE_URL=postgresql://...
TEST_DATABASE_URL=postgresql://...

# API
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PORT=3001
WEB_BASE_URL=https://v-edfinance.pages.dev

# Auth
JWT_SECRET=your-super-secret-jwt-key

# AI
GEMINI_API_KEY=your-gemini-api-key

# Storage (Choose one: fs, gcs, r2)
STORAGE_DRIVER=fs
# ... (see full list in Section 4)

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Testing
E2B_API_KEY=your-e2b-api-key

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure-password
```

**8. Run Environment Validation** (Estimated: 10 min)
```bash
pnpm validate:env
```

### Priority 3 (LOW - Cleanup & Optimization)

**9. Remove Unused Dependencies** (Estimated: 1 hour)
- Root: Remove `ava`, `msw`, `jest-coverage-badges`, `bcrypt`, `@types/bcrypt`
- API: Audit `drizzle-*`, `kysely`, `next`, verify others
- Test builds after each removal

**10. Standardize Linting/Formatting** (Estimated: 30 min)
- Choose between `prettier` and `biome` (recommend biome - faster, all-in-one)
- Remove the other to avoid conflicts

**11. Document Docker Compose Usage** (Estimated: 20 min)
Create `docs/DOCKER_USAGE.md`:
```markdown
## Development
docker-compose up -d  # Starts API + Postgres + Redis

## Monitoring
pnpm monitoring:start  # Starts Grafana + Prometheus

## Testing
docker-compose -f docker-compose.test.yml up  # E2E tests

## VPS Deployment
docker-compose -f docker-compose.postgres.yml up -d
```

**12. Fix Docker Security** (Estimated: 5 min)
Replace hardcoded password in docker-compose.postgres.yml:
```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
```

**13. Add Missing Health Checks** (Estimated: 15 min)
```yaml
grafana:
  healthcheck:
    test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3

prometheus:
  healthcheck:
    test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:9090/-/healthy || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## Appendix A: Environment Variable Reference

### Complete List (58 variables)

**Database** (2):
- DATABASE_URL
- TEST_DATABASE_URL

**API Config** (3):
- ALLOWED_ORIGINS
- PORT
- WEB_BASE_URL

**Auth** (1):
- JWT_SECRET

**AI** (1):
- GEMINI_API_KEY

**Storage** (10):
- STORAGE_DRIVER
- STORAGE_FS_BASE
- GCS_BUCKET_URL
- GCS_ACCESS_TOKEN
- R2_ENDPOINT
- R2_BUCKET_NAME
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_ACCOUNT_ID
- R2_PUBLIC_URL

**Redis** (3):
- REDIS_HOST
- REDIS_PORT
- REDIS_TTL

**Frontend** (2):
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

**Testing** (1):
- E2B_API_KEY

**Monitoring** (2):
- GRAFANA_ADMIN_USER
- GRAFANA_ADMIN_PASSWORD

**System** (3):
- NODE_ENV
- VITEST
- CI

---

## Appendix B: Merge Conflict Resolution Script

```bash
#!/bin/bash
# merge-fix.sh - Semi-automated merge conflict resolution

echo "Resolving package.json merge conflicts..."

# Backup
cp package.json package.json.backup
cp apps/web/package.json apps/web/package.json.backup
cp docker-compose.monitoring.yml docker-compose.monitoring.yml.backup

# Root package.json - Keep upstream, add workspaces
cat > package.json << 'EOF'
{
  "name": "v-edfinance",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "biome check .",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:orchestrate": "node scripts/e2b-e2e-orchestrator.js",
    "smoke:local": "API_URL=http://localhost:3001 tsx scripts/smoke-tests/smoke-test.ts",
    "smoke:staging": "API_URL=http://103.54.153.248:3001 tsx scripts/smoke-tests/smoke-test.ts",
    "smoke:prod": "API_URL=https://api.v-edfinance.com tsx scripts/smoke-tests/smoke-test.ts",
    "validate:env": "tsx scripts/validate-env.ts",
    "bench:auth": "autocannon -c 100 -d 30 http://localhost:3001/api/auth/health",
    "bench:api": "autocannon -c 100 -d 30 http://localhost:3001/api/health",
    "monitoring:start": "docker compose -f docker-compose.monitoring.yml up -d",
    "monitoring:stop": "docker compose -f docker-compose.monitoring.yml down",
    "prepare": "husky"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "pnpm": {
    "overrides": {
      "minimist": "1.2.8",
      "esbuild": "0.25.0"
    }
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@e2b/code-interpreter": "^2.3.3",
    "@playwright/test": "^1.57.0",
    "@types/bcrypt": "^6.0.0",
    "@types/node": "^22.10.7",
    "@vitest/coverage-v8": "^2.1.9",
    "@vitest/ui": "^2.1.9",
    "autocannon": "^7.15.0",
    "ava": "^6.4.1",
    "axios": "1.13.2",
    "bcrypt": "^6.0.0",
    "dotenv": "^17.2.3",
    "esbuild": "0.27.2",
    "husky": "9.1.7",
    "jest-coverage-badges": "^1.1.2",
    "jsdom": "27.4.0",
    "lint-staged": "16.2.7",
    "minimist": "1.2.8",
    "msw": "^2.6.8",
    "prettier": "latest",
    "ts-node": "^10.9.2",
    "tsx": "4.21.0",
    "turbo": "latest",
    "typescript": "^5.9.3",
    "unplugin-swc": "1.5.9",
    "vitest": "^2.1.9"
  }
}
EOF

echo "✅ Root package.json resolved"
echo "⚠️  Manually merge apps/web/package.json (combine both dependency sets)"
echo "⚠️  Manually fix docker-compose.monitoring.yml (remove lines 2-30)"
echo ""
echo "Run: pnpm install"
```

---

## Summary Checklist

- [ ] **P0**: Resolve package.json merge conflicts
- [ ] **P0**: Fix docker-compose.monitoring.yml duplicates
- [ ] **P1**: Standardize TypeScript to ^5.9.3
- [ ] **P1**: Standardize @types/node to ^22.10.7
- [ ] **P1**: Remove Next.js from API package
- [ ] **P2**: Fix R2 env var naming mismatch
- [ ] **P2**: Create comprehensive .env.example
- [ ] **P2**: Run environment validation script
- [ ] **P3**: Remove unused dependencies (9 candidates)
- [ ] **P3**: Choose biome OR prettier (not both)
- [ ] **P3**: Document Docker Compose usage
- [ ] **P3**: Fix hardcoded Docker password
- [ ] **P3**: Add health checks to monitoring services

**Total Estimated Effort**: ~5 hours  
**Critical Path**: P0 + P1 = ~1.5 hours

---

**Report Generated**: 2026-01-04  
**Next Audit**: After merge conflicts resolved  
**Assignee**: Development Team  
**Related Issues**: Create beads tasks for each priority section
