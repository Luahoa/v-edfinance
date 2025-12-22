# Task 1.3: Audit & Rotate Secrets in Git History

**Status:** 🔴 CRITICAL  
**Priority:** P0  
**ETA:** 1-2 hours

---

## Security Assessment

### Step 1: Check if .env is in .gitignore

```bash
# Check .gitignore
grep -i "^\.env" .gitignore

# Expected: .env should be listed
```

**✅ VERIFIED:** `.env` is in `.gitignore`

### Step 2: Scan Git History for .env Leaks

```bash
# Search entire git history for .env file commits
git log --all --full-history --name-only --pretty=format: -- .env | sort -u

# Check if .env was ever committed
git log --all --full-history -- .env
```

**Expected Output:**
- **If empty:** ✅ Good - .env never committed
- **If shows commits:** 🔴 CRITICAL - .env was committed in the past

### Step 3: Scan for Hardcoded Secrets in Code

```bash
# Search for common secret patterns
echo "Scanning for hardcoded secrets..."

# 1. Database URLs with passwords
rg "postgresql://.*:.*@" --type ts --type js

# 2. JWT secrets
rg "jwt.*secret.*=.*['\"]" --type ts --type js

# 3. API keys
rg "(API|SECRET)_KEY.*=.*['\"][a-zA-Z0-9]{20,}" --type ts --type js

# 4. Cloudflare tokens
rg "R2_.*KEY.*=.*['\"]" --type ts --type js

# 5. Generic secrets
rg "password.*=.*['\"]" --type ts --type js --ignore-case
```

---

## Current Secret Status

### Files Checked

I've verified that `.env` exists in the repo but **IS** in `.gitignore`.

**However**, we need to check:
1. Was `.env` committed before being added to `.gitignore`?
2. Are there hardcoded secrets in code?
3. Are example env files safe?

---

## Remediation Plan

### Scenario A: .env Found in Git History (CRITICAL)

**If git history shows .env commits:**

#### Step 1: Remove from History (BFG Repo-Cleaner)

```bash
# Install BFG (faster than git-filter-branch)
# Windows: choco install bfg
# Mac: brew install bfg
# Linux: Download from https://rtyley.github.io/bfg-repo-cleaner/

# Clone fresh copy
git clone --mirror https://github.com/luahoa/v-edfinance.git v-edfinance-mirror
cd v-edfinance-mirror

# Remove .env from ALL commits
bfg --delete-files .env

# Rewrite history
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ REQUIRES TEAM COORDINATION)
git push --force
```

**⚠️ WARNING:** This rewrites git history. Coordinate with team:
1. Notify all team members
2. Everyone must re-clone after force push
3. Open PRs will need rebasing

#### Step 2: Rotate ALL Secrets Immediately

**Why:** Assume all secrets in old .env are compromised.

```bash
# Generate new secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # ENCRYPTION_KEY

# Update on VPS
ssh deployer@103.54.153.248
nano /path/to/.env  # Update secrets

# Restart services
docker-compose restart api web

# Update local .env with new secrets (never commit!)
```

**Secrets to Rotate:**
1. `DATABASE_URL` password
2. `JWT_SECRET`
3. `JWT_REFRESH_SECRET`
4. `ENCRYPTION_KEY`
5. `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`
6. `CLOUDFLARE_API_KEY` (if present)
7. Any API keys (Gemini, etc.)

#### Step 3: Verify Cleanup

```bash
# Clone fresh copy and verify
git clone https://github.com/luahoa/v-edfinance.git verify-clean
cd verify-clean

# Search history again
git log --all --full-history -- .env
# Should show: nothing

# Search for any secret patterns
rg "postgresql://postgres:.*@" --type-add 'all:*' --all
# Should show: nothing in committed code
```

### Scenario B: No .env in History (Good!)

**If git log shows no .env commits:**

#### Step 1: Scan for Hardcoded Secrets

```bash
# Create secret scanning script
cat > scripts/scan-secrets.sh << 'EOF'
#!/bin/bash

echo "🔍 Scanning for hardcoded secrets..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

ISSUES_FOUND=0

# 1. Database URLs
echo "Checking for database URLs..."
if grep -r "postgresql://.*:.*@" apps/ --exclude-dir=node_modules --exclude="*.md" -n; then
  echo -e "${RED}❌ Found hardcoded database URLs${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND+1))
else
  echo -e "${GREEN}✅ No hardcoded database URLs${NC}"
fi

# 2. JWT Secrets
echo "Checking for JWT secrets..."
if grep -r "jwt.*secret.*=.*['\"]" apps/ --exclude-dir=node_modules -i -n; then
  echo -e "${RED}❌ Found hardcoded JWT secrets${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND+1))
else
  echo -e "${GREEN}✅ No hardcoded JWT secrets${NC}"
fi

# 3. API Keys (20+ chars)
echo "Checking for API keys..."
if grep -r "api.*key.*=.*['\"][a-zA-Z0-9]{20,}" apps/ --exclude-dir=node_modules -i -n; then
  echo -e "${RED}❌ Found hardcoded API keys${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND+1))
else
  echo -e "${GREEN}✅ No hardcoded API keys${NC}"
fi

# 4. Cloudflare R2 keys
echo "Checking for R2 keys..."
if grep -r "R2_.*KEY.*=.*['\"]" apps/ --exclude-dir=node_modules -n; then
  echo -e "${RED}❌ Found hardcoded R2 keys${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND+1))
else
  echo -e "${GREEN}✅ No hardcoded R2 keys${NC}"
fi

if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "\n${GREEN}✅ No hardcoded secrets found!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Found $ISSUES_FOUND types of hardcoded secrets${NC}"
  exit 1
fi
EOF

chmod +x scripts/scan-secrets.sh
./scripts/scan-secrets.sh
```

#### Step 2: Verify Example Files are Safe

```bash
# Check example env files
cat .env.dokploy.example
cat .env.kamal.example

# Should contain placeholders like:
# DATABASE_URL="postgresql://user:PASSWORD_HERE@host:5432/db"
# JWT_SECRET="GENERATE_WITH_OPENSSL"
# Not actual secrets!
```

#### Step 3: Implement Secret Management Best Practices

**Create `.env.example` template:**

```bash
# .env.example (safe to commit)
# Copy to .env and fill in real values

# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/vedfinance"

# JWT
JWT_SECRET="GENERATE_WITH: openssl rand -hex 32"
JWT_REFRESH_SECRET="GENERATE_WITH: openssl rand -hex 32"

# Encryption
ENCRYPTION_KEY="GENERATE_WITH: openssl rand -hex 32"

# Cloudflare R2
R2_ACCOUNT_ID="your_account_id"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET_NAME="v-edfinance-backup"

# AI Services
GEMINI_API_KEY="your_gemini_key"

# Redis
REDIS_URL="redis://localhost:6379"
```

**Update README.md with setup instructions:**

```markdown
## Environment Setup

1. Copy example env file:
   ```bash
   cp .env.example .env
   ```

2. Generate secrets:
   ```bash
   # JWT secrets
   openssl rand -hex 32  # Use for JWT_SECRET
   openssl rand -hex 32  # Use for JWT_REFRESH_SECRET
   openssl rand -hex 32  # Use for ENCRYPTION_KEY
   ```

3. Get service credentials:
   - Cloudflare R2: Dashboard → R2 → API Tokens
   - Gemini API: https://makersuite.google.com/app/apikey

4. Fill in .env with your values

⚠️ **NEVER commit .env to git!**
```

---

## Secret Rotation Procedure

### 1. Database Password

```bash
# VPS - Change PostgreSQL password
ssh deployer@103.54.153.248
docker exec -it vedfinance-postgres psql -U postgres
ALTER USER postgres PASSWORD 'NEW_STRONG_PASSWORD';
\q

# Update .env
DATABASE_URL="postgresql://postgres:NEW_STRONG_PASSWORD@postgres:5432/vedfinance"

# Restart API
docker-compose restart api
```

### 2. JWT Secrets

```bash
# Generate new secrets
NEW_JWT_SECRET=$(openssl rand -hex 32)
NEW_REFRESH_SECRET=$(openssl rand -hex 32)

# Update .env
JWT_SECRET="$NEW_JWT_SECRET"
JWT_REFRESH_SECRET="$NEW_REFRESH_SECRET"

# ⚠️ WARNING: This will invalidate all existing user sessions!
# Users will need to re-login

# Restart API
docker-compose restart api
```

### 3. Cloudflare R2 Keys

```bash
# Cloudflare Dashboard:
# 1. R2 → API Tokens → Revoke old token
# 2. Create new token with same permissions
# 3. Update .env with new credentials

R2_ACCESS_KEY_ID="new_access_key"
R2_SECRET_ACCESS_KEY="new_secret_key"

# Test connection
rclone ls r2:v-edfinance-backup
```

### 4. AI Service Keys

```bash
# Gemini API:
# 1. https://makersuite.google.com/app/apikey
# 2. Revoke old key
# 3. Create new key
# 4. Update .env

GEMINI_API_KEY="new_key"
```

---

## Prevention Measures

### 1. Pre-commit Hook (Block .env Commits)

```bash
# .husky/pre-commit
#!/bin/sh

# Check for .env in staged files
if git diff --cached --name-only | grep -q "^\.env$"; then
  echo "❌ ERROR: Attempting to commit .env file!"
  echo "Remove it from staging: git reset HEAD .env"
  exit 1
fi

# Check for hardcoded secrets
./scripts/scan-secrets.sh || exit 1
```

### 2. GitHub Secret Scanning (Already in Task 1.2)

Enable in `.github/workflows/security-scanning.yml`

### 3. .gitignore Enforcement

```gitignore
# .gitignore - Ensure these are present
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
```

### 4. Secret Management Tools (Future)

**Consider for production:**
- **HashiCorp Vault** - Enterprise secret management
- **AWS Secrets Manager** - Cloud-based
- **Doppler** - Developer-friendly, free tier
- **1Password CLI** - Team password manager integration

---

## Verification Checklist

After completing remediation:

- [ ] `.env` NOT in git history: `git log --all -- .env` shows nothing
- [ ] `.env` in `.gitignore`
- [ ] No hardcoded secrets in code: `./scripts/scan-secrets.sh` passes
- [ ] `.env.example` exists with placeholders
- [ ] All production secrets rotated (if .env was in history)
- [ ] Pre-commit hook prevents .env commits
- [ ] README.md documents secret setup
- [ ] Team notified of secret rotation (if applicable)

---

## Incident Response (If Secrets Leaked)

**If .env was found in public git history:**

### Immediate Actions (< 1 hour)

1. **Rotate ALL secrets** (database, JWT, API keys)
2. **Force push history cleanup** (BFG)
3. **Monitor for unauthorized access**
   - Check database logs
   - Check API access logs
   - Check Cloudflare R2 access logs

### Short-term Actions (24 hours)

4. **Notify stakeholders** (if applicable)
5. **Review access logs** for suspicious activity
6. **Enable 2FA** on all service accounts
7. **Update security documentation**

### Long-term Actions (1 week)

8. **Implement secret management tool**
9. **Security training** for team
10. **Quarterly secret rotation** policy

---

## Success Criteria

- ✅ No `.env` file in git history
- ✅ No hardcoded secrets in code
- ✅ Secret scanning automated in CI
- ✅ Pre-commit hooks prevent accidental commits
- ✅ Documentation updated with secret management procedures
- ✅ (If leaked) All secrets rotated and monitored

---

## Next Steps

1. Run secret scanning: `./scripts/scan-secrets.sh`
2. If issues found: Follow remediation plan
3. If clean: Verify and document
4. Proceed to Task 1.4: Cloudflare WAF
