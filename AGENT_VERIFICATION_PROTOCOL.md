# 🧪 Agent Verification Protocol
**Testing & Quality Assurance for Sub-Agents**

**Version:** 1.0  
**Effective Date:** 2025-12-21  
**Applies to:** All agents in Phase 0 deployment  
**Authority:** MANDATORY before agent marked "complete"

---

## 🎯 VERIFICATION PHILOSOPHY

### Core Principle
> **"Trust, but verify. Every agent. Every time. No exceptions."**

### Why This Matters
```
❌ Without Verification:
   Agent claims success → Actually broke 5 things → Cascade failure

✅ With Verification:
   Agent completes → Tests pass → Build green → Confidence high
```

---

## 📋 5-STAGE VERIFICATION PROCESS

### Stage 1: Pre-Deployment Verification
**When:** BEFORE agent starts work  
**Duration:** 2 minutes  
**Owner:** Orchestrator

#### Checklist:
```bash
# 1. Capture baseline state
BASELINE_ERRORS=$(pnpm --filter api build 2>&1 | grep "error TS" | wc -l)
echo "Baseline: $BASELINE_ERRORS errors" > agent-${AGENT_ID}-baseline.log

# 2. Create backup branch
git branch agent-${AGENT_ID}-backup

# 3. Verify dependencies
if [ -n "$DEPENDS_ON" ]; then
  git log | grep -q "fix(agent): $DEPENDS_ON" || {
    echo "❌ Dependency $DEPENDS_ON not complete"
    exit 1
  }
fi

# 4. Verify files exist
for file in $TARGET_FILES; do
  [ -f "$file" ] || {
    echo "❌ Target file missing: $file"
    exit 1
  }
done

# 5. Lock environment
echo "$AGENT_ID" > .agent-lock
```

**Success Criteria:**
- ✅ Baseline captured
- ✅ Backup created
- ✅ Dependencies met
- ✅ Files accessible
- ✅ Lock acquired

---

### Stage 2: In-Flight Monitoring
**When:** DURING agent execution  
**Duration:** Continuous  
**Owner:** Monitoring system

#### Real-Time Checks:
```bash
# 1. File watch (alert on unexpected changes)
inotifywait -m -r apps/api/src -e modify,create,delete | \
  while read path action file; do
    if [[ ! "$ALLOWED_FILES" =~ "$file" ]]; then
      echo "⚠️  Agent touched unexpected file: $file"
      logger "Agent $AGENT_ID touched $file unexpectedly"
    fi
  done

# 2. Time limit enforcement
timeout ${MAX_DURATION}m agent_task || {
  echo "❌ Agent exceeded time limit: ${MAX_DURATION}m"
  kill $(pgrep -f agent_task)
  exit 1
}

# 3. Resource monitoring
while agent_running; do
  CPU=$(ps aux | grep agent | awk '{print $3}')
  MEM=$(ps aux | grep agent | awk '{print $4}')
  
  if (( $(echo "$CPU > 80" | bc -l) )); then
    echo "⚠️  High CPU usage: $CPU%"
  fi
  
  sleep 5
done
```

**Alert Conditions:**
- ⚠️ Unexpected file modifications
- ⚠️ Time limit exceeded
- ⚠️ Resource usage > 80%

---

### Stage 3: Post-Execution Validation
**When:** IMMEDIATELY after agent claims completion  
**Duration:** 5 minutes  
**Owner:** Verification agent

#### Automated Checks:

##### 3.1 Build Regression Test
```bash
#!/bin/bash
# verify-build.sh

echo "🔍 Stage 3.1: Build Regression Test"

# Build and capture errors
pnpm --filter api build 2>&1 | tee agent-${AGENT_ID}-after.log

AFTER_ERRORS=$(grep "error TS" agent-${AGENT_ID}-after.log | wc -l)
BASELINE_ERRORS=$(cat agent-${AGENT_ID}-baseline.log | grep -o '[0-9]*')

echo "Baseline: $BASELINE_ERRORS errors"
echo "After:    $AFTER_ERRORS errors"

# Verify improvement (or at least no regression)
if [ $AFTER_ERRORS -gt $BASELINE_ERRORS ]; then
  echo "❌ FAIL: Build got WORSE ($BASELINE_ERRORS → $AFTER_ERRORS)"
  exit 1
elif [ $AFTER_ERRORS -eq $BASELINE_ERRORS ]; then
  echo "⚠️  WARNING: No improvement ($AFTER_ERRORS errors remain)"
  echo "Agent may not have worked correctly"
  # Allow manual override
  read -p "Continue? (y/n) " -n 1 -r
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
else
  IMPROVEMENT=$((BASELINE_ERRORS - AFTER_ERRORS))
  echo "✅ PASS: Reduced by $IMPROVEMENT errors"
fi
```

##### 3.2 Type Safety Check
```bash
#!/bin/bash
# verify-types.sh

echo "🔍 Stage 3.2: Type Safety Check"

cd apps/api

# Full type check (no emit)
tsc --noEmit 2>&1 | tee agent-${AGENT_ID}-types.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "✅ PASS: No type errors"
else
  ERROR_COUNT=$(grep "error TS" agent-${AGENT_ID}-types.log | wc -l)
  echo "❌ FAIL: $ERROR_COUNT type errors found"
  head -n 20 agent-${AGENT_ID}-types.log
  exit 1
fi
```

##### 3.3 Lint Check
```bash
#!/bin/bash
# verify-lint.sh

echo "🔍 Stage 3.3: Lint Check"

# Only lint files changed by agent
git diff --name-only | grep "\.ts$" | while read file; do
  echo "Linting $file..."
  pnpm eslint "$file" --quiet
  
  if [ $? -ne 0 ]; then
    echo "❌ Lint errors in $file"
    LINT_FAIL=1
  fi
done

if [ -n "$LINT_FAIL" ]; then
  echo "❌ FAIL: Lint errors found"
  exit 1
else
  echo "✅ PASS: No lint errors"
fi
```

##### 3.4 File Integrity Check
```bash
#!/bin/bash
# verify-files.sh

echo "🔍 Stage 3.4: File Integrity Check"

# Get list of changed files
CHANGED=$(git diff --name-only)

# Compare to allowed files
for file in $CHANGED; do
  if [[ ! "$ALLOWED_FILES" =~ "$file" ]]; then
    echo "❌ FAIL: Unexpected file modified: $file"
    echo "Agent was only allowed to touch: $ALLOWED_FILES"
    exit 1
  fi
done

# Check for large unexpected changes
git diff --stat | while read line; do
  FILE=$(echo $line | awk '{print $1}')
  ADDITIONS=$(echo $line | grep -o '[0-9]* insertion' | grep -o '[0-9]*')
  DELETIONS=$(echo $line | grep -o '[0-9]* deletion' | grep -o '[0-9]*')
  
  if [ ${ADDITIONS:-0} -gt 100 ] || [ ${DELETIONS:-0} -gt 50 ]; then
    echo "⚠️  Large change in $FILE: +$ADDITIONS -$DELETIONS"
    echo "Review manually before proceeding"
  fi
done

echo "✅ PASS: File integrity maintained"
```

##### 3.5 Git History Check
```bash
#!/bin/bash
# verify-git.sh

echo "🔍 Stage 3.5: Git History Check"

# Verify agent committed work
COMMITS=$(git log --oneline --since="10 minutes ago" --author="agent" | wc -l)

if [ $COMMITS -eq 0 ]; then
  echo "❌ FAIL: Agent did not commit changes"
  exit 1
fi

# Verify commit message format
LAST_COMMIT=$(git log -1 --oneline)
if [[ ! "$LAST_COMMIT" =~ "fix(agent): ${AGENT_ID}" ]]; then
  echo "❌ FAIL: Invalid commit message format"
  echo "Expected: fix(agent): ${AGENT_ID} - [description]"
  echo "Got: $LAST_COMMIT"
  exit 1
fi

echo "✅ PASS: Git history valid"
```

---

### Stage 4: Functional Testing
**When:** After Stage 3 passes  
**Duration:** 10 minutes  
**Owner:** Test agent

#### Schema Change Tests (for Agents A01, A02)
```bash
#!/bin/bash
# test-schema-changes.sh

echo "🧪 Stage 4: Functional Testing (Schema)"

# 1. Verify migration exists
if [ ! -d "apps/api/prisma/migrations" ]; then
  echo "❌ No migrations directory found"
  exit 1
fi

LATEST_MIGRATION=$(ls -t apps/api/prisma/migrations | head -n 1)
echo "Latest migration: $LATEST_MIGRATION"

# 2. Verify migration SQL
if [ ! -f "apps/api/prisma/migrations/$LATEST_MIGRATION/migration.sql" ]; then
  echo "❌ Migration SQL file missing"
  exit 1
fi

# 3. Check for destructive operations (should be none)
if grep -qi "DROP TABLE\|DELETE FROM" "apps/api/prisma/migrations/$LATEST_MIGRATION/migration.sql"; then
  echo "⚠️  WARNING: Destructive operation detected in migration"
  cat "apps/api/prisma/migrations/$LATEST_MIGRATION/migration.sql"
  read -p "Proceed? (y/n) " -n 1 -r
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# 4. Verify Prisma client regenerated
if ! npx prisma --version; then
  echo "❌ Prisma CLI not working"
  exit 1
fi

# 5. Test database connection
cd apps/api
DATABASE_URL_TEST="postgresql://user:pass@localhost:5432/test_db"
if npx prisma db push --skip-generate 2>&1 | grep -q "error"; then
  echo "❌ Database schema push failed"
  exit 1
fi

echo "✅ PASS: Schema changes functional"
```

#### Code Change Tests (for Agents B, C, D)
```bash
#!/bin/bash
# test-code-changes.sh

echo "🧪 Stage 4: Functional Testing (Code)"

cd apps/api

# 1. Unit test smoke test
echo "Running unit tests..."
pnpm test --run --reporter=verbose 2>&1 | tee test-output.log

# Check for catastrophic failures (>50% fail rate)
TOTAL_TESTS=$(grep -o "[0-9]* passed" test-output.log | grep -o "[0-9]*" || echo "0")
FAILED_TESTS=$(grep -o "[0-9]* failed" test-output.log | grep -o "[0-9]*" || echo "0")

if [ $TOTAL_TESTS -eq 0 ]; then
  echo "❌ No tests ran - test suite broken"
  exit 1
fi

FAIL_RATE=$((100 * FAILED_TESTS / TOTAL_TESTS))
if [ $FAIL_RATE -gt 50 ]; then
  echo "❌ FAIL: >50% tests failing ($FAIL_RATE%)"
  exit 1
fi

echo "✅ PASS: Test suite functional (fail rate: $FAIL_RATE%)"

# 2. Import validation
echo "Validating imports..."
for file in $(git diff --name-only | grep "\.ts$"); do
  # Check for circular dependencies
  npx madge --circular "$file" && {
    echo "❌ Circular dependency detected in $file"
    exit 1
  }
  
  # Check for missing imports
  if grep -q "Cannot find module" <(tsc --noEmit "$file" 2>&1); then
    echo "❌ Missing imports in $file"
    exit 1
  fi
done

echo "✅ PASS: Import validation passed"
```

---

### Stage 5: Integration Verification
**When:** After Stage 4 passes  
**Duration:** 5 minutes  
**Owner:** Integration test agent

#### End-to-End Build Test
```bash
#!/bin/bash
# verify-integration.sh

echo "🔗 Stage 5: Integration Verification"

# 1. Clean build (no cache)
echo "Running clean build..."
pnpm clean || rm -rf node_modules/.cache
pnpm build --force 2>&1 | tee integration-build.log

if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "❌ FAIL: Clean build failed"
  tail -n 50 integration-build.log
  exit 1
fi

# 2. Verify all packages build
EXPECTED_PACKAGES=("api" "web")
for pkg in "${EXPECTED_PACKAGES[@]}"; do
  if ! grep -q "Successfully compiled.*$pkg" integration-build.log; then
    echo "❌ FAIL: Package $pkg did not build"
    exit 1
  fi
done

# 3. Test import resolution across packages
cd apps/api
node -e "require('./dist/main')" 2>&1 | grep -q "Error" && {
  echo "❌ FAIL: API bundle has import errors"
  exit 1
}

# 4. Verify no duplicate dependencies
echo "Checking for duplicate dependencies..."
pnpm ls --depth=0 2>&1 | grep -i "duplicate" && {
  echo "⚠️  WARNING: Duplicate dependencies found"
  # Non-fatal, but log it
}

echo "✅ PASS: Integration verified"
```

---

## 📊 VERIFICATION SCORECARD

### Agent Verification Report Template
```markdown
# Agent ${AGENT_ID} Verification Report

**Agent:** ${AGENT_NAME}
**Task:** ${TASK_DESCRIPTION}
**Date:** $(date)
**Duration:** ${DURATION} minutes

## Stage 1: Pre-Deployment ✅/❌
- [ ] Baseline captured: ${BASELINE_ERRORS} errors
- [ ] Backup created: agent-${AGENT_ID}-backup
- [ ] Dependencies met: ${DEPENDS_ON}
- [ ] Lock acquired: .agent-lock

## Stage 2: In-Flight Monitoring ✅/❌
- [ ] No unexpected file changes
- [ ] Time limit respected: ${DURATION}/${MAX_DURATION}m
- [ ] Resource usage normal: CPU ${CPU_AVG}%, MEM ${MEM_AVG}%

## Stage 3: Post-Execution ✅/❌
- [ ] Build regression: ${BASELINE_ERRORS} → ${AFTER_ERRORS} errors
- [ ] Type safety: ${TYPE_ERRORS} errors
- [ ] Lint: ${LINT_ERRORS} errors
- [ ] File integrity: ${FILES_CHANGED} files (expected: ${EXPECTED_FILES})
- [ ] Git history: Commit ${COMMIT_SHA}

## Stage 4: Functional Testing ✅/❌
- [ ] Schema migration: ${MIGRATION_NAME}
- [ ] Database push: Success
- [ ] Unit tests: ${TEST_PASS}/${TEST_TOTAL} passed
- [ ] Import validation: No circular deps

## Stage 5: Integration ✅/❌
- [ ] Clean build: Success
- [ ] All packages: api ✅, web ✅
- [ ] Import resolution: No errors
- [ ] Duplicate check: ${DUPLICATE_COUNT} found

## Final Verdict: ✅ PASS / ❌ FAIL / ⚠️ WARNING

### Issues Found:
${ISSUES_LIST}

### Recommendations:
${RECOMMENDATIONS}

### Rollback Required: YES / NO

---

**Verified by:** Verification Agent V01
**Signature:** $(git log -1 --format="%H")
```

---

## 🚨 FAILURE RESPONSE MATRIX

| Stage | Failure Type | Severity | Response |
|-------|--------------|----------|----------|
| **Stage 1** | Missing dependency | 🔴 Critical | STOP - Do not deploy |
| **Stage 1** | Baseline capture fail | 🔴 Critical | STOP - Fix environment |
| **Stage 2** | Unexpected file change | 🟡 Warning | LOG - Review manually |
| **Stage 2** | Time limit exceeded | 🔴 Critical | KILL - Agent hung |
| **Stage 3** | Build regression | 🔴 Critical | ROLLBACK - Revert changes |
| **Stage 3** | Type errors | 🔴 Critical | ROLLBACK - Code broken |
| **Stage 3** | Lint errors | 🟡 Warning | FIX - Auto-fix or manual |
| **Stage 4** | Schema migration fail | 🔴 Critical | ROLLBACK - DB corrupted |
| **Stage 4** | >50% tests fail | 🔴 Critical | ROLLBACK - Breaking change |
| **Stage 5** | Integration fail | 🔴 Critical | ROLLBACK - System broken |

### Automated Rollback Procedure
```bash
#!/bin/bash
# rollback-agent.sh

AGENT_ID=$1

echo "🔄 Rolling back Agent $AGENT_ID"

# 1. Revert code changes
git reset --hard agent-${AGENT_ID}-backup
git branch -D agent-${AGENT_ID}-backup

# 2. Revert database (if schema agent)
if [[ "$AGENT_ID" =~ ^A0[12]$ ]]; then
  cd apps/api
  npx prisma migrate resolve --rolled-back ${MIGRATION_NAME}
fi

# 3. Clean build artifacts
pnpm clean

# 4. Verify rollback success
pnpm --filter api build 2>&1 | tee rollback-verify.log
ERRORS=$(grep "error TS" rollback-verify.log | wc -l)
BASELINE=$(cat agent-${AGENT_ID}-baseline.log | grep -o '[0-9]*')

if [ $ERRORS -eq $BASELINE ]; then
  echo "✅ Rollback successful: Back to $BASELINE errors"
else
  echo "❌ Rollback FAILED: Expected $BASELINE, got $ERRORS"
  echo "MANUAL INTERVENTION REQUIRED"
  exit 1
fi

# 5. Release lock
rm .agent-lock

# 6. Log incident
cat >> PHASE0_INCIDENTS.md << EOF
## Incident: Agent $AGENT_ID Rollback
**Date:** $(date)
**Reason:** Verification failed
**Stage Failed:** ${FAILED_STAGE}
**Errors:** ${ERROR_MESSAGE}
**Resolution:** Rolled back to baseline
**Status:** System stable at $BASELINE errors
---
EOF

echo "Incident logged to PHASE0_INCIDENTS.md"
```

---

## 🎯 VERIFICATION AUTOMATION

### Continuous Verification Script
```bash
#!/bin/bash
# continuous-verify.sh

AGENT_ID=$1

echo "🤖 Starting continuous verification for Agent $AGENT_ID"

# Stage 1
./verify-scripts/stage1-pre-deploy.sh $AGENT_ID || exit 1

# Stage 2 (background monitoring)
./verify-scripts/stage2-monitor.sh $AGENT_ID &
MONITOR_PID=$!

# Wait for agent to complete
wait $AGENT_COMPLETION_SIGNAL

# Kill monitor
kill $MONITOR_PID

# Stage 3
./verify-scripts/stage3-post-exec.sh $AGENT_ID || {
  ./rollback-agent.sh $AGENT_ID
  exit 1
}

# Stage 4
./verify-scripts/stage4-functional.sh $AGENT_ID || {
  ./rollback-agent.sh $AGENT_ID
  exit 1
}

# Stage 5
./verify-scripts/stage5-integration.sh $AGENT_ID || {
  ./rollback-agent.sh $AGENT_ID
  exit 1
}

# Success!
echo "✅ Agent $AGENT_ID VERIFIED - All stages passed"
./verify-scripts/generate-report.sh $AGENT_ID > reports/agent-${AGENT_ID}-report.md
```

---

## 📈 VERIFICATION METRICS

### Per-Agent Metrics to Track
```typescript
interface AgentVerificationMetrics {
  agentId: string;
  duration: number; // minutes
  stages: {
    stage1: { passed: boolean; duration: number };
    stage2: { passed: boolean; duration: number; alerts: number };
    stage3: { passed: boolean; duration: number; errors: number };
    stage4: { passed: boolean; duration: number; testFailures: number };
    stage5: { passed: boolean; duration: number };
  };
  outcome: 'PASS' | 'FAIL' | 'ROLLBACK';
  errorReduction: number; // Baseline - After
  filesChanged: number;
  linesChanged: { additions: number; deletions: number };
  rollbackRequired: boolean;
}
```

### Aggregate Metrics Dashboard
```bash
# Generate metrics summary
cat reports/agent-*-report.md | ./parse-metrics.sh > PHASE0_METRICS.json

# Sample output:
{
  "totalAgents": 9,
  "passed": 9,
  "failed": 0,
  "rolledBack": 0,
  "avgDuration": 35, // minutes
  "totalErrorReduction": 33,
  "buildHealth": {
    "before": 33,
    "after": 0,
    "improvement": "100%"
  },
  "efficiency": {
    "errorsPerHour": 5.5,
    "agentsPerHour": 1.5
  }
}
```

---

## ✅ VERIFICATION CHECKLIST (TLDR)

### Before Agent Starts:
- [ ] Baseline errors captured
- [ ] Backup branch created
- [ ] Dependencies verified
- [ ] Lock acquired

### During Agent Execution:
- [ ] Monitor running
- [ ] Time limit enforced
- [ ] Resource usage tracked

### After Agent Claims Done:
- [ ] Build improves (or no regression)
- [ ] Type check passes
- [ ] Lint passes
- [ ] Only expected files changed
- [ ] Valid git commit

### Functional Testing:
- [ ] Schema migration valid (if applicable)
- [ ] Unit tests run (>50% pass rate)
- [ ] No circular dependencies

### Integration:
- [ ] Clean build succeeds
- [ ] All packages compile
- [ ] No import errors

### Final Sign-Off:
- [ ] Verification report generated
- [ ] Metrics logged
- [ ] Ready for next agent

---

**🎖️ MANDATE:**

**NO agent proceeds without passing ALL 5 stages.**  
**NO exceptions.**  
**NO shortcuts.**  
**Verification is NON-NEGOTIABLE.**

---

**Next:** See [PHASE0_AGENT_DEPLOYMENT_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/PHASE0_AGENT_DEPLOYMENT_PLAN.md) for agent roster
