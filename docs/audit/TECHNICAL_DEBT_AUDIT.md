# Technical Debt Audit Guide

**Purpose**: Systematic identification and elimination of technical debt using Beads task management

---

## 🎯 What is Technical Debt?

Technical debt represents shortcuts, workarounds, or suboptimal implementations that need to be fixed to maintain code quality and velocity.

### Categories

1. **Code Debt**
   - Complexity issues
   - Duplicate code
   - Dead code
   - Anti-patterns

2. **Dependency Debt**
   - Outdated packages
   - Security vulnerabilities
   - Unused dependencies

3. **Performance Debt**
   - Slow queries
   - N+1 problems
   - Large bundles
   - Memory leaks

4. **Documentation Debt**
   - Missing API docs
   - Outdated README
   - No architecture diagrams

---

## 🔍 Scanning Process

### Automated Scans

**1. Code Quality (Biome)**
```bash
pnpm biome check . --reporter=json > audit/code-quality.json
```

**2. Dependency Audit**
```bash
pnpm audit --json > audit/dependencies.json
```

**3. Test Coverage**
```bash
pnpm test:coverage --reporter=json > audit/coverage.json
```

**4. Performance Baseline**
```bash
pnpm bench:api > audit/performance-baseline.txt
```

### Manual Review Checklist

```markdown
## Code Architecture
- [ ] Consistent file structure
- [ ] Clear separation of concerns
- [ ] No circular dependencies
- [ ] Proper error handling

## Database
- [ ] Indexes on foreign keys
- [ ] No N+1 queries
- [ ] Proper connection pooling
- [ ] Migrations up-to-date

## Security
- [ ] Environment variables not hardcoded
- [ ] JWT properly configured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled

## Performance
- [ ] API response time < 100ms
- [ ] Bundle size < 200KB
- [ ] Lighthouse score > 90
- [ ] No memory leaks
```

---

## 📊 Debt Scoring System

### Priority Matrix

| Severity | Impact | Effort | Priority | SLA |
|----------|--------|--------|----------|-----|
| Critical | High | Any | P0 | 1 day |
| High | High | Low-Med | P0 | 3 days |
| High | Med | Low | P1 | 1 week |
| Medium | Any | Low | P2 | 2 weeks |
| Low | Any | Any | P3 | Backlog |

### Examples

**P0 (Critical)**:
- Security vulnerabilities (high/critical)
- Production bugs
- Performance issues affecting users
- Data integrity risks

**P1 (High)**:
- Memory leaks
- Slow API endpoints
- Missing tests for critical paths
- Deprecated dependency usage

**P2 (Medium)**:
- Code complexity > 15
- Duplicate code blocks
- Missing documentation
- Test coverage < 80%

**P3 (Low)**:
- Style violations
- Minor refactoring opportunities
- Nice-to-have optimizations

---

## 🤖 AI Agent Integration

### CodeGuardian Scan Workflow

```bash
# Initialize epic
bd create "Technical Debt Scan 2025" -t epic -p 0 --json

# Run automated scan
.\scripts\audit\scan-code-quality.ps1

# Review generated tasks
bd list --deps discovered-from:ved-debt-scan --json

# Start work on ready tasks
bd ready --priority 0 --json
```

### Task Creation Pattern

For each finding:

```yaml
Title: "Fix: [Issue Description]"
Description: |
  **Location**: apps/api/src/auth/auth.service.ts:45-67
  **Issue**: Cyclomatic complexity 18 exceeds threshold 10
  **Category**: Code Quality
  **Tool**: Biome / ts-complexity
  
  **Suggestion**:
  - Extract validateUser() method
  - Separate error handling
  - Use early returns
  
  **Acceptance Criteria**:
  - [ ] Complexity reduced to < 10
  - [ ] Tests still pass
  - [ ] No functionality change

Type: bug
Priority: 2
Tags: technical-debt, refactor, code-quality
Dependencies: discovered-from:ved-debt-scan
```

---

## 📈 Progress Tracking

### Metrics Dashboard

```bash
# Run daily
.\scripts\audit\beads-dashboard.ps1

# Output:
# Total Debt Tasks: 87
# Critical (P0): 0  ✅
# High (P1): 12
# Medium (P2): 45
# Low (P3): 30
# Completion: 23%
```

### Weekly Goals

**Week 1**: Discovery
- All scans complete
- Tasks created and prioritized
- Dependencies mapped

**Week 2**: Critical Path
- All P0 tasks closed
- 50% of P1 tasks closed

**Week 3**: Cleanup
- All P1 tasks closed
- 70% of P2 tasks closed

**Week 4**: Polish
- 90% of P2 tasks closed
- P3 tasks triaged for future sprints

---

## 🎯 Success Criteria

### Code Quality
- [ ] 0 Biome errors
- [ ] All functions complexity < 10
- [ ] No console.log in production
- [ ] Consistent code style

### Dependencies
- [ ] 0 critical vulnerabilities
- [ ] 0 high vulnerabilities
- [ ] All packages < 2 versions behind
- [ ] No unused dependencies

### Performance
- [ ] API p95 < 100ms
- [ ] Bundle size < 200KB
- [ ] Lighthouse score > 90
- [ ] Database queries < 50ms

### Documentation
- [ ] 100% API endpoints documented
- [ ] README.md current
- [ ] Architecture diagrams updated
- [ ] Deployment guide tested

---

## 📋 Common Technical Debt Patterns

### Pattern 1: God Class/Function

**Symptom**: File > 500 lines, function > 50 lines

**Fix**:
```typescript
// Before: God class
class UserService {
  create() { /* 100 lines */ }
  validate() { /* 80 lines */ }
  authenticate() { /* 120 lines */ }
  // ... 500+ lines total
}

// After: Single Responsibility
class UserService {
  constructor(
    private validator: UserValidator,
    private authenticator: UserAuthenticator
  ) {}
  
  create(data: CreateUserDto) {
    return this.validator.validate(data);
  }
}
```

### Pattern 2: N+1 Queries

**Symptom**: Database queries in loops

**Fix**:
```typescript
// Before: N+1
const users = await prisma.user.findMany();
for (const user of users) {
  user.posts = await prisma.post.findMany({ where: { userId: user.id } });
}

// After: Single query with include
const users = await prisma.user.findMany({
  include: { posts: true }
});
```

### Pattern 3: Missing Error Handling

**Symptom**: No try-catch, unhandled promises

**Fix**:
```typescript
// Before
async function updateUser(id: string, data: any) {
  return await prisma.user.update({ where: { id }, data });
}

// After
async function updateUser(id: string, data: UpdateUserDto) {
  try {
    return await prisma.user.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
    }
    throw error;
  }
}
```

---

## 🛠️ Remediation Scripts

### Auto-fix Safe Issues

```bash
# Fix Biome auto-fixable issues
pnpm biome check --write .

# Remove unused imports
npx ts-remove-unused --write

# Format code
pnpm format
```

### Verify No Regressions

```bash
# After any fix
pnpm test
pnpm build
pnpm lint
```

---

## 📝 Reporting

### Daily Report Template

```markdown
# Technical Debt Report - [Date]

## Summary
- **New Issues Found**: 12
- **Issues Resolved**: 8
- **Net Change**: +4
- **Total Outstanding**: 87

## Critical Items (P0)
- None ✅

## Top 3 Issues
1. High complexity in `apps/api/src/auth/auth.service.ts`
2. N+1 query in user enrollment flow
3. Missing tests for payment processing

## Blockers
- None

## Next Focus
- Complete P1 auth refactor
- Add tests for payment flow
```

---

**Use this guide in conjunction with SUB_AGENT_WORKFLOWS.md for comprehensive technical debt elimination.**
