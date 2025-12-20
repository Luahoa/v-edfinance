# Sub-Agent Workflows for Beads-Based Audit

This document defines the specific workflows for each AI sub-agent in the audit process.

---

## 🎭 Sub-Agent Personas

Each sub-agent is specialized for a specific domain and follows strict protocols for creating and managing Beads tasks.

---

## 🛡️ Sub-Agent 1: CodeGuardian

### Personality
**Role**: Senior Code Reviewer  
**Focus**: Code quality, maintainability, best practices  
**Strictness**: High (zero tolerance for bad patterns)

### Responsibilities
1. Scan codebase using Biome
2. Identify code smells and anti-patterns
3. Check cyclomatic complexity
4. Flag duplicate code
5. Verify naming conventions

### Workflow

**Step 1: Initialize Scan**
```bash
bd create "Code Quality Scan - Full Codebase" \
  --description="Automated scan for code quality issues" \
  -t task -p 1 \
  --json > scan-task.json

SCAN_ID=$(cat scan-task.json | jq -r '.id')
```

**Step 2: Run Automated Tools**
```bash
# Biome check
pnpm biome check . --reporter=json > biome-report.json

# Custom complexity analysis
npx ts-complexity . --json > complexity-report.json
```

**Step 3: Create Beads Tasks for Findings**
```bash
# For each issue found
cat biome-report.json | jq -r '.diagnostics[] | @json' | while read issue; do
  SEVERITY=$(echo $issue | jq -r '.severity')
  FILE=$(echo $issue | jq -r '.location.path')
  LINE=$(echo $issue | jq -r '.location.span.start')
  MESSAGE=$(echo $issue | jq -r '.message')
  
  PRIORITY=2  # Default medium priority
  if [ "$SEVERITY" = "error" ]; then PRIORITY=1; fi
  
  bd create "Fix: $MESSAGE" \
    --description="File: $FILE:$LINE\nSeverity: $SEVERITY" \
    -t bug -p $PRIORITY \
    --deps discovered-from:$SCAN_ID \
    --json
done
```

**Step 4: Update Scan Summary**
```bash
COUNT=$(bd list --deps discovered-from:$SCAN_ID --json | jq 'length')

bd update $SCAN_ID \
  --description="Scan complete. Found $COUNT issues. See child tasks." \
  --status in_progress \
  --json
```

### Issue Categories

**Priority 0 (Critical)**:
- Security vulnerabilities in code
- Null pointer risks
- Infinite loop potential

**Priority 1 (High)**:
- Biome errors
- Complexity > 15
- Duplicate code blocks (>20 lines)

**Priority 2 (Medium)**:
- Biome warnings
- Complexity 10-15
- Missing error handling

**Priority 3 (Low)**:
- Naming convention violations
- Missing comments
- Minor style issues

### Output Format

Each task created by CodeGuardian:

```yaml
Title: "Fix: [Issue Type] in [ComponentName]"
Description: |
  Location: apps/api/src/auth/auth.service.ts:45-67
  Issue: Cyclomatic complexity 18 exceeds threshold of 10
  
  Suggestion:
  - Extract validateUser() method
  - Separate error handling logic
  - Use early returns
  
  Tool: Biome / ts-complexity
  Severity: High (Priority 1)
  
Type: bug
Priority: 1
Tags: code-quality, refactor, auth
Dependencies: discovered-from:ved-debt-code
```

---

## 🧪 Sub-Agent 2: TestMaster

### Personality
**Role**: QA Engineer  
**Focus**: Test coverage, quality assurance  
**Strictness**: Medium (pragmatic about coverage goals)

### Responsibilities
1. Analyze test coverage reports
2. Identify untested code paths
3. Create test tasks for critical paths
4. Verify E2E test coverage
5. Ensure test quality

### Workflow

**Step 1: Generate Coverage Report**
```bash
# Unit test coverage
pnpm test:coverage --reporter=json --reporter=html

# E2E test inventory
pnpm playwright test --list > e2e-inventory.txt
```

**Step 2: Analyze Coverage Gaps**
```powershell
# Parse coverage report
$coverage = Get-Content coverage/coverage-summary.json | ConvertFrom-Json

foreach ($file in $coverage.PSObject.Properties) {
    $stats = $file.Value
    $filename = $file.Name
    
    $lineCoverage = $stats.lines.pct
    $branchCoverage = $stats.branches.pct
    
    # Determine priority based on coverage
    if ($lineCoverage -lt 50) {
        $priority = 1  # High - critically low coverage
    } elseif ($lineCoverage -lt 80) {
        $priority = 2  # Medium
    } else {
        $priority = 3  # Low - just improvement
    }
    
    # Only create task if below acceptable threshold
    if ($lineCoverage -lt 90) {
        bd create "Add tests: $filename" `
          --description="Current coverage: $lineCoverage%. Target: 90%+" `
          -t task -p $priority `
          --deps blocks:ved-test-coverage `
          --json
    }
}
```

**Step 3: Identify Critical Path Gaps**
```bash
# Critical paths that MUST be tested
CRITICAL_PATHS=(
  "apps/api/src/auth/*.ts"
  "apps/api/src/payments/*.ts"
  "apps/api/src/users/*.ts"
)

for path in "${CRITICAL_PATHS[@]}"; do
  # Check coverage for critical path
  coverage=$(jq ".\"$path\".lines.pct" coverage/coverage-summary.json)
  
  if [ "$coverage" -lt "95" ]; then
    bd create "CRITICAL: Test coverage for $path" \
      --description="Current: $coverage%. REQUIRED: 95%+" \
      -t task -p 0 \
      --deps blocks:ved-test-coverage \
      --json
  fi
done
```

**Step 4: E2E Coverage Check**
```bash
# Expected E2E tests for critical flows
REQUIRED_E2E=(
  "login-flow.spec.ts"
  "registration-flow.spec.ts"
  "create-class.spec.ts"
  "enroll-student.spec.ts"
  "payment-flow.spec.ts"
)

for test in "${REQUIRED_E2E[@]}"; do
  if ! grep -q "$test" e2e-inventory.txt; then
    bd create "Create E2E test: $test" \
      --description="Missing critical user flow test" \
      -t task -p 1 \
      --deps blocks:ved-test-e2e \
      --json
  fi
done
```

### Coverage Targets by Component

| Component | Target | Rationale |
|-----------|--------|-----------|
| Auth | 95%+ | Security critical |
| Payments | 95%+ | Money handling |
| API Controllers | 85%+ | User-facing |
| Services | 90%+ | Business logic |
| Utils | 80%+ | Support code |
| UI Components | 70%+ | Manual testing supplement |

### Task Template

```yaml
Title: "Add unit tests: [ComponentName]"
Description: |
  File: apps/api/src/auth/auth.service.ts
  Current Coverage: 62%
  Target Coverage: 95%
  
  Missing Tests:
  - [ ] validateUser() - line 45
  - [ ] hashPassword() - line 78
  - [ ] Error handling for invalid credentials
  - [ ] Edge case: null inputs
  
  Test Framework: Vitest
  Priority: High (critical path)
  
Type: task
Priority: 1
Tags: testing, unit-test, auth
Dependencies: blocks:ved-test-coverage
```

---

## 🔒 Sub-Agent 3: SecureGuard

### Personality
**Role**: Security Auditor  
**Focus**: Vulnerabilities, OWASP compliance  
**Strictness**: Extreme (no compromises on security)

### Responsibilities
1. Run dependency vulnerability scans
2. Check OWASP Top 10 compliance
3. Audit authentication/authorization
4. Review environment variable security
5. Validate input sanitization

### Workflow

**Step 1: Dependency Audit**
```bash
# NPM audit
pnpm audit --json > security-audit.json

# Parse and create tasks
cat security-audit.json | jq -r '.vulnerabilities | to_entries[] | @json' | while read vuln; do
  SEVERITY=$(echo $vuln | jq -r '.value.severity')
  PACKAGE=$(echo $vuln | jq -r '.key')
  TITLE=$(echo $vuln | jq -r '.value.title')
  
  # Map severity to priority
  case $SEVERITY in
    critical) PRIORITY=0 ;;
    high) PRIORITY=0 ;;
    moderate) PRIORITY=1 ;;
    low) PRIORITY=2 ;;
  esac
  
  bd create "Security: $TITLE in $PACKAGE" \
    --description="Severity: $SEVERITY\nAction: Update dependency" \
    -t bug -p $PRIORITY \
    --deps discovered-from:ved-sec-deps \
    --json
done
```

**Step 2: OWASP Top 10 Checklist**
```bash
# Create tasks for each OWASP category
OWASP_ITEMS=(
  "A01:Broken Access Control"
  "A02:Cryptographic Failures"
  "A03:Injection"
  "A04:Insecure Design"
  "A05:Security Misconfiguration"
  "A06:Vulnerable Components"
  "A07:Authentication Failures"
  "A08:Data Integrity Failures"
  "A09:Logging Failures"
  "A10:SSRF"
)

for item in "${OWASP_ITEMS[@]}"; do
  bd create "Security Audit: $item" \
    --description="Review codebase for OWASP $item compliance" \
    -t task -p 0 \
    --deps blocks:ved-security-audit \
    --json
done
```

**Step 3: Authentication Review**
```bash
bd create "Audit JWT Implementation" \
--description="
Checklist:
- [ ] JWT secret is strong and from env
- [ ] Token expiration properly configured
- [ ] Refresh token rotation implemented
- [ ] No JWT in localStorage (httpOnly cookies)
- [ ] CSRF protection enabled
- [ ] Rate limiting on login endpoint
- [ ] Account lockout after failed attempts
" \
  -t task -p 0 \
  --deps blocks:ved-sec-auth \
  --json
```

**Step 4: Environment Security**
```bash
# Check for exposed secrets
bd create "Audit environment variables" \
  --description="
- [ ] No secrets in .env.example
- [ ] All .env files in .gitignore
- [ ] No hardcoded API keys in code
- [ ] Dokploy secrets properly configured
- [ ] Check git history for leaked secrets
" \
  -t task -p 0 \
  --deps blocks:ved-sec-env \
  --json
```

### Security Severity Mapping

| Finding | Priority | SLA |
|---------|----------|-----|
| Critical vulnerability | P0 | 24 hours |
| High vulnerability | P0 | 3 days |
| Moderate vulnerability | P1 | 1 week |
| Low vulnerability | P2 | 2 weeks |
| Best practice violation | P3 | Backlog |

### Task Template

```yaml
Title: "Security: [Vulnerability Type]"
Description: |
  Package: jsonwebtoken v8.5.0
  Vulnerability: CVE-2022-23529
  Severity: HIGH
  
  Impact: Allows authentication bypass
  
  Remediation:
  - Update to jsonwebtoken ^9.0.0
  - Test all auth flows after update
  - Deploy emergency patch
  
  Reference: https://nvd.nist.gov/vuln/detail/CVE-2022-23529
  
Type: bug
Priority: 0 (CRITICAL)
Tags: security, dependency, auth
Dependencies: discovered-from:ved-sec-deps
```

---

## ⚡ Sub-Agent 4: SpeedDemon

### Personality
**Role**: Performance Engineer  
**Focus**: Speed, optimization, efficiency  
**Strictness**: Medium (balance speed with maintainability)

### Responsibilities
1. Benchmark API endpoints
2. Analyze database queries
3. Profile frontend bundle size
4. Identify N+1 query problems
5. Optimize critical paths

### Workflow

**Step 1: API Benchmarking**
```bash
# Benchmark all endpoints
ENDPOINTS=(
  "http://localhost:3001/api/health"
  "http://localhost:3001/api/auth/login"
  "http://localhost:3001/api/users"
  "http://localhost:3001/api/classes"
)

for endpoint in "${ENDPOINTS[@]}"; do
  # Run autocannon
  autocannon -c 50 -d 10 "$endpoint" --json > "bench-$(echo $endpoint | md5).json"
  
  # Parse results
  P95=$(jq '.latency.p95' "bench-$(echo $endpoint | md5).json")
  
  # If slower than 100ms, create task
  if [ "$P95" -gt 100 ]; then
    bd create "Optimize API: $endpoint" \
      --description="Current p95: ${P95}ms. Target: <100ms" \
      -t task -p 2 \
      --deps blocks:ved-perf-api \
      --json
  fi
done
```

**Step 2: Database Query Analysis**
```bash
# Enable Prisma query logging
export DEBUG="prisma:query"

# Run typical application flow and capture logs
pnpm dev > query-log.txt 2>&1 &
sleep 30
pkill -f "pnpm dev"

# Analyze for N+1 queries
# (Custom script that parses Prisma logs)
node scripts/audit/analyze-queries.js query-log.txt | while read query; do
  bd create "Optimize DB query: $query" \
    --description="Potential N+1 detected. Consider using include/select" \
    -t task -p 1 \
    --deps blocks:ved-perf-db \
    --json
done
```

**Step 3: Frontend Performance**
```bash
# Build and analyze bundle
pnpm build
npx webpack-bundle-analyzer dist/stats.json --json > bundle-analysis.json

# Check bundle sizes
MAIN_BUNDLE_SIZE=$(jq '.assets[] | select(.name == "main.js") | .size' bundle-analysis.json)

if [ "$MAIN_BUNDLE_SIZE" -gt 200000 ]; then  # 200KB threshold
  bd create "Reduce main bundle size" \
    --description="Current: ${MAIN_BUNDLE_SIZE} bytes. Target: <200KB" \
    -t task -p 2 \
    --deps blocks:ved-perf-bundle \
    --json
fi
```

**Step 4: Lighthouse Audit**
```bash
# Run Lighthouse
pnpm playwright test --grep lighthouse | tee lighthouse-results.txt

PERFORMANCE_SCORE=$(grep "Performance:" lighthouse-results.txt | awk '{print $2}')

if [ "$PERFORMANCE_SCORE" -lt 90 ]; then
  bd create "Improve Lighthouse performance score" \
    --description="Current: $PERFORMANCE_SCORE. Target: >90" \
    -t task -p 2 \
    --deps blocks:ved-perf-frontend \
    --json
fi
```

### Performance Budgets

| Metric | Budget | Method |
|--------|--------|--------|
| API p95 latency | <100ms | Autocannon |
| Database query | < 50ms | Prisma logging |
| Main bundle size | <200KB | Webpack analyzer |
| Lighthouse Performance | > 90 | Playwright |
| Time to Interactive | < 3s | Chrome DevTools |

### Task Template

```yaml
Title: "Optimize: [Component/Endpoint]"
Description: |
  Endpoint: POST /api/auth/login
  Current Performance: p95 = 145ms
  Target: p95 < 100ms
  
  Profiling Results:
  - Database query: 78ms (bcrypt.compare)
  - JWT generation: 42ms
  - Validation: 15ms
  
  Optimization Ideas:
  - [ ] Add Redis caching for user lookup
  - [ ] Optimize bcrypt rounds (currently 12)
  - [ ] Consider parallel JWT generation
  
  Benchmark: autocannon -c 50 -d 10
  
Type: task
Priority: 2
Tags: performance, optimization, api
Dependencies: blocks:ved-perf-api
```

---

## 📚 Sub-Agent 5: DocScribe

### Personality
**Role**: Technical Writer  
**Focus**: Documentation, clarity, completeness  
**Strictness**: Medium (practical documentation goals)

### Responsibilities
1. Audit API documentation (Swagger)
2. Check README accuracy
3. Verify architecture diagrams
4. Ensure code comments
5. Validate deployment guides

### Workflow

**Step 1: API Documentation Audit**
```bash
# Extract all API routes
grep -r "@Controller\|@Get\|@Post\|@Put\|@Delete" apps/api/src --include="*.ts" > routes.txt

# Check for Swagger annotations
while read route; do
  FILE=$(echo $route | cut -d: -f1)
  LINE=$(echo $route | cut -d: -f2)
  
  # Check if @ApiOperation exists nearby
  if ! grep -A5 -B5 "$LINE" "$FILE" | grep -q "@ApiOperation"; then
    ROUTE_NAME=$(echo $route | grep -oP '@(Get|Post|Put|Delete)\(.*?\)' || echo "unknown")
    
    bd create "Document API route: $ROUTE_NAME" \
      --description="File: $FILE\nMissing @ApiOperation annotation" \
      -t task -p 3 \
      --deps blocks:ved-docs-api \
      --json
  fi
done < routes.txt
```

**Step 2: README Accuracy Check**
```bash
bd create "Update README.md" \
  --description="
Checklist:
- [ ] Tech stack list is current
- [ ] All CLI tools documented
- [ ] Getting started steps tested
- [ ] Environment variables explained
- [ ] Deployment links work
- [ ] License up-to-date
" \
  -t task -p 2 \
  --deps blocks:ved-docs-dev \
  --json
```

**Step 3: Architecture Documentation**
```bash
bd create "Update ARCHITECTURE.md" \
  --description="
Missing/Outdated:
- [ ] Add Beads task management section
- [ ] Update monitoring tools (Netdata, etc.)
- [ ] Document Cloudflare R2 integration
- [ ] Add system architecture diagram
- [ ] Update database schema diagram
" \
  -t task -p 2 \
  --deps blocks:ved-docs-arch \
  --json
```

**Step 4: Code Comment Audit**
```bash
# Find complex functions without JSDoc
npx ts-complexity apps --json | jq -r '.[] | select(.complexity > 10) | @json' | while read func; do
  FILE=$(echo $func | jq -r '.file')
  NAME=$(echo $func | jq -r '.name')
  COMPLEXITY=$(echo $func | jq -r '.complexity')
  
  # Check if JSDoc exists
  if ! grep -B3 "function $NAME\|const $NAME" "$FILE" | grep -q "\/\*\*"; then
    bd create "Add JSDoc: $NAME" \
      --description="File: $FILE\nComplexity: $COMPLEXITY\nNeeds documentation" \
      -t task -p 3 \
      --deps blocks:ved-docs-dev \
      --json
  fi
done
```

### Documentation Standards

| Document | Must Have | Nice to Have |
|----------|-----------|--------------|
| API Endpoints | Swagger annotations, examples | Error codes, rate limits |
| README.md | Setup, tech stack, commands | Badges, screenshots |
| ARCHITECTURE.md | System diagram, data flow | Decision records |
| Code | JSDoc for complex functions | Inline comments for clarity |
| Deployment | Step-by-step guide | Troubleshooting section |

### Task Template

```yaml
Title: "Document: [API Endpoint/Component]"
Description: |
  Endpoint: POST /api/users
  File: apps/api/src/users/users.controller.ts:45
  
  Missing Documentation:
  - [ ] @ApiOperation summary
  - [ ] @ApiBody schema definition
  - [ ] @ApiResponse 200, 400, 401, 500
  - [ ] Example request/response
  - [ ] Authentication requirements
  
  Reference: Existing docs at POST /api/auth/login
  
Type: task
Priority: 3
Tags: documentation, api, swagger
Dependencies: blocks:ved-docs-api
```

---

## 🔄 Inter-Agent Coordination

### Dependency Rules

1. **SecurityGuard → CodeGuardian**
   - Security fixes may reveal code quality issues

2. **TestMaster → All Agents**
   - Tests must be added after any code changes

3. **SpeedDemon → CodeGuardian**
   - Performance optimizations shouldn't reduce code quality

4. **DocScribe → All Agents**
   - All changes must be documented

### Beads Dependency Syntax

```bash
# Task B depends on Task A (A blocks B)
bd dep add ved-taskB ved-taskA

# Task discovered during work on parent
bd create "Fix bug" --deps discovered-from:ved-parent

# Task blocks epic completion
bd create "Critical fix" --deps blocks:ved-epic-id
```

---

## 📊 Progress Tracking

### Daily Agent Report

Each sub-agent produces:

```json
{
  "agent": "CodeGuardian",
  "date": "2025-12-21",
  "tasksCreated": 12,
  "tasksClosed": 8,
  "priorityBreakdown": {
    "p0": 0,
    "p1": 3,
    "p2": 7,
    "p3": 2
  },
  "topIssues": [
    "High complexity in auth.service.ts",
    "Duplicate code in payment processors",
    "Missing error handling in API controllers"
  ]
}
```

### Weekly Summary

```bash
# Generate summary
.\scripts\audit\weekly-summary.ps1

# Output Markdown report
# - Tasks created by each agent
# - Completion rate
# - Blocker analysis
# - Projected completion date
```

---

## ✅ Completion Criteria

Each sub-agent completes when:

- **CodeGuardian**: 0 P0/P1 code quality issues
- **TestMaster**: 90%+ coverage achieved
- **SecureGuard**: 0 critical/high vulnerabilities
- **SpeedDemon**: All performance budgets met
- **DocScribe**: 100% API docs, current README

Final audit complete when ALL sub-agent tasks closed ✅

---

**This workflow document should be referenced by AI agents when executing audit tasks via Beads.**
