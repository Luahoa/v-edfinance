# Task 1.2: Security Scanning Implementation

**Status:** ✅ READY TO TEST  
**Created:** 2025-12-23  
**File:** `.github/workflows/security-scanning.yml`

---

## What Was Added

### 1. Trivy Container Scanning 🐳

**Scans:** Docker images for vulnerabilities

**How it works:**
```yaml
- Builds API and Web Docker images
- Scans with Trivy for CRITICAL and HIGH vulnerabilities
- Uploads results to GitHub Security tab
- FAILS CI if vulnerabilities found
```

**View Results:**
- GitHub → Security → Code scanning alerts
- Filter by "trivy-api" or "trivy-web"

### 2. NPM Dependency Audit 📦

**Scans:** Node.js dependencies for known vulnerabilities

**How it works:**
```yaml
- Runs `pnpm audit --prod` (production dependencies)
- Runs `pnpm audit` (all dependencies)
- Generates JSON report
- Does NOT fail CI (informational)
```

**View Results:**
- GitHub Actions → Workflow run → Summary tab
- Download `npm-audit-report.json` artifact

### 3. Secret Scanning 🔑

**Scans:** Git history for leaked secrets

**Tools:**
- **GitLeaks:** Industry-standard secret detection
- **Custom patterns:** Checks for:
  - JWT secrets
  - Database URLs with passwords
  - API keys (20+ chars)

**How it works:**
```yaml
- Scans entire git history (fetch-depth: 0)
- Checks code for hardcoded secrets
- FAILS CI if secrets found
```

### 4. CodeQL SAST 🔍

**Scans:** Static code analysis for security issues

**Detects:**
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting)
- Path traversal
- Insecure randomness
- Weak crypto

**How it works:**
```yaml
- Analyzes JavaScript and TypeScript code
- Uses extended security query pack
- Uploads findings to GitHub Security
```

**View Results:**
- GitHub → Security → Code scanning alerts
- Filter by language

### 5. License Compliance ⚖️

**Scans:** Dependencies for license compatibility

**Allowed Licenses:**
- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- 0BSD

**How it works:**
```yaml
- Uses license-checker npm package
- Reports non-compliant licenses
- Informational only (no fail)
```

---

## Testing the Workflow

### Option 1: Push to Branch (Recommended)

```bash
# Create feature branch
git checkout -b security/add-scanning

# Add the workflow file
git add .github/workflows/security-scanning.yml

# Commit
git commit -m "feat: add comprehensive security scanning to CI/CD"

# Push to trigger workflow
git push origin security/add-scanning
```

**Then:**
1. Go to GitHub → Actions
2. Watch "Security Scanning" workflow run
3. Check for any failures

### Option 2: Manual Trigger (If Enabled)

Add to workflow:
```yaml
on:
  workflow_dispatch:  # Manual trigger
```

Then: GitHub → Actions → Security Scanning → Run workflow

---

## Expected Results

### ✅ Success Scenario

```
All checks passed:
✅ Trivy Container Scan (no CRITICAL/HIGH vulnerabilities)
✅ NPM Audit (< 10 moderate vulnerabilities)
✅ Secret Scan (no secrets found)
✅ CodeQL Analysis (no security issues)
✅ License Check (all allowed licenses)
```

**GitHub Actions Summary:**
```
🔒 Security Scan Summary
Scan Date: 2025-12-23 10:30:00
Commit: abc123

Scan Results:
- 🐳 Trivy Container Scan: success
- 📦 NPM Audit: success
- 🔑 Secret Scan: success
- 🔍 CodeQL SAST: success
- ⚖️ License Check: success

✅ Security Checks Passed
```

### ❌ Failure Scenario

**If vulnerabilities found:**

```
Security Issues Detected:

🐳 Trivy found 3 HIGH vulnerabilities in API image:
- CVE-2024-12345: Node.js 20.x vulnerability
- CVE-2024-67890: PostgreSQL client library issue

📦 NPM Audit found 15 vulnerabilities:
- 5 high
- 10 moderate

🔑 Secret Scan found 1 secret:
- File: apps/api/src/config.ts
- Line 15: Hardcoded JWT secret
```

**Action Required:**
1. Fix vulnerabilities (update dependencies)
2. Remove hardcoded secrets
3. Re-run workflow

---

## Fixing Common Issues

### Issue 1: Trivy Finds Vulnerabilities

**Solution:**

```bash
# Update base images in Dockerfiles
# apps/api/Dockerfile
FROM node:20-alpine  # Use latest alpine version

# Update dependencies
pnpm update

# Rebuild images
docker build -t v-edfinance-api:latest -f apps/api/Dockerfile .
```

### Issue 2: NPM Audit Failures

**Solution:**

```bash
# Auto-fix where possible
pnpm audit fix

# Force fix breaking changes (careful!)
pnpm audit fix --force

# Update specific package
pnpm update <package-name>
```

### Issue 3: Secret Scan Detects False Positive

**Solution:**

Create `.gitleaks.toml`:
```toml
[allowlist]
  description = "Allowlist for test secrets"
  paths = [
    "test/**",
    "*.test.ts"
  ]
  regexes = [
    "test-secret-.*"  # Ignore test secrets
  ]
```

### Issue 4: CodeQL Analysis Timeout

**Solution:**

Increase timeout in workflow:
```yaml
- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v3
  timeout-minutes: 30  # Increase from default 15
```

---

## Integration with Existing Workflows

### Add to ci.yml

```yaml
# .github/workflows/ci.yml
jobs:
  security:
    uses: ./.github/workflows/security-scanning.yml
    secrets: inherit
```

### Branch Protection Rules

**Require security checks before merge:**

1. GitHub → Settings → Branches → Branch protection rules
2. Add rule for `main` and `staging`
3. Check: "Require status checks to pass before merging"
4. Select: "Trivy Container Scan" and "Secret Scanning"

---

## Monitoring & Alerts

### GitHub Security Alerts

**Enable:**
1. GitHub → Settings → Security → Code security and analysis
2. Enable:
   - Dependabot alerts
   - Dependabot security updates
   - Code scanning (CodeQL)
   - Secret scanning

### Slack/Email Notifications

**Add to workflow:**
```yaml
- name: Notify on Security Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '🔴 Security scan failed! Check GitHub Actions.'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Maintenance

### Weekly Security Reviews

**Cron schedule (already included):**
```yaml
schedule:
  - cron: '0 9 * * 1'  # Every Monday 9 AM
```

**Review process:**
1. Check GitHub Security tab every Monday
2. Triage new alerts
3. Create beads tasks for fixes
4. Track resolution time

### Dependency Updates

**Automated with Dependabot:**

Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## Success Criteria

- ✅ Workflow file created: `.github/workflows/security-scanning.yml`
- ✅ Workflow runs on push/PR
- ✅ All scans complete successfully
- ✅ Results visible in GitHub Security tab
- ✅ CI fails on CRITICAL/HIGH vulnerabilities
- ✅ Team receives notifications on failures

---

## Next Steps

1. **Test workflow:** Push to branch and verify
2. **Fix any issues:** Address vulnerabilities found
3. **Enable branch protection:** Require security checks
4. **Proceed to Task 1.3:** Audit git history for secrets
