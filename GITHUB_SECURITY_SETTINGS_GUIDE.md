# GitHub Security Settings Configuration Guide

**Task**: Complete Phase 4 of GitHub Security Cleanup  
**Duration**: ~15 minutes  
**Prerequisite**: GitHub repository owner/admin access

---

## Step 1: Enable Secret Scanning (5 min)

### 1.1 Navigate to Security Settings

1. Go to your repository: https://github.com/Luahoa/v-edfinance
2. Click **Settings** (top navigation)
3. Click **Code security and analysis** (left sidebar)

### 1.2 Enable Secret Scanning

**Location**: Settings → Code security and analysis → Secret scanning

**Actions**:
1. Find **"Secret scanning"** section
2. Click **"Enable"** button
3. ✅ Should show: "Secret scanning is enabled"

**What it does**:
- Scans all commits for exposed secrets (API keys, tokens, credentials)
- Alerts you if secrets are found
- Free for public repos, included in GitHub Advanced Security for private

### 1.3 Enable Push Protection

**Location**: Same page, under "Secret scanning"

**Actions**:
1. Find **"Push protection"** section (below Secret scanning)
2. Click **"Enable"** button
3. ✅ Should show: "Push protection is enabled"

**What it does**:
- Blocks commits containing secrets from being pushed
- Prevents accidental secret exposure at push time
- Developers can bypass with justification (logged)

**Screenshot Verification**:
```
✓ Secret scanning: Enabled
✓ Push protection: Enabled
```

---

## Step 2: Enable Dependabot Alerts (3 min)

### 2.1 Enable Dependabot Alerts

**Location**: Settings → Code security and analysis → Dependabot

**Actions**:
1. Find **"Dependabot alerts"** section
2. Click **"Enable"** button
3. ✅ Should show: "Dependabot alerts are enabled"

**What it does**:
- Scans dependencies for known vulnerabilities
- Creates alerts when vulnerabilities found
- Recommends version updates

### 2.2 Enable Dependabot Security Updates

**Actions**:
1. Find **"Dependabot security updates"** section
2. Click **"Enable"** button
3. ✅ Should show: "Dependabot security updates are enabled"

**What it does**:
- Automatically creates PRs to fix vulnerable dependencies
- Updates to secure versions
- You review and merge the PRs

**Screenshot Verification**:
```
✓ Dependabot alerts: Enabled
✓ Dependabot security updates: Enabled
```

---

## Step 3: Configure Branch Protection (7 min)

### 3.1 Navigate to Branch Settings

1. Go to: https://github.com/Luahoa/v-edfinance/settings/branches
2. Click **"Add branch protection rule"**

### 3.2 Configure Protection for `main` Branch

**Branch name pattern**: `main`

#### Required Settings

**Protect matching branches**:
- [x] **Require a pull request before merging**
  - [x] Require approvals: **1** (if working with team)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (if CODEOWNERS file exists)

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Select status checks: (if CI/CD configured)
    - `build` (if exists)
    - `test` (if exists)
    - `lint` (if exists)

- [x] **Require conversation resolution before merging**
  - Ensures all PR comments are resolved

- [x] **Require signed commits** (optional, but recommended)
  - Verifies commit authenticity

- [ ] **Require linear history** (optional)
  - Prevents merge commits (use rebase/squash)

- [x] **Include administrators**
  - Apply rules to admins too (best practice)

- [x] **Restrict who can push to matching branches**
  - Leave empty to allow all collaborators
  - Or specify users/teams if needed

- [x] **Allow force pushes** → Select: **"Specify who can force push"**
  - Add yourself (for emergency cleanup only)
  - ⚠️ Use with extreme caution

- [ ] **Allow deletions** 
  - Keep unchecked (prevent accidental main deletion)

#### Click "Create" Button

### 3.3 Verification

Go to: https://github.com/Luahoa/v-edfinance/settings/branches

Should show:
```
Branch protection rules
✓ main
  - Require pull request reviews before merging
  - Require status checks to pass
  - Require conversation resolution
  - Include administrators
  - Restrict force pushes
```

---

## Step 4: Review Repository Access (Optional, 2 min)

### 4.1 Navigate to Access Settings

1. Go to: https://github.com/Luahoa/v-edfinance/settings/access
2. Review **"Collaborators and teams"**

### 4.2 Audit Access

**Check**:
- Who has access to the repository?
- Are all collaborators still active?
- Do they need the level of access they have?

**Actions**:
- Remove inactive collaborators
- Downgrade access if needed (Admin → Write → Read)
- Invite new members if needed

---

## Step 5: Configure Code Scanning (Optional, Advanced)

### 5.1 Enable CodeQL Analysis

**Location**: Settings → Code security and analysis → Code scanning

**Actions**:
1. Find **"Code scanning"** section
2. Click **"Set up"** → **"Default"**
3. Select languages: JavaScript, TypeScript
4. Click **"Enable CodeQL"**

**What it does**:
- Scans code for security vulnerabilities
- Finds SQL injection, XSS, etc.
- Creates alerts for issues found

---

## Verification Checklist

After completing all steps, verify:

### Security Features
- [ ] Secret scanning: Enabled
- [ ] Push protection: Enabled
- [ ] Dependabot alerts: Enabled
- [ ] Dependabot security updates: Enabled

### Branch Protection (main)
- [ ] Require PR before merge
- [ ] Require status checks
- [ ] Require conversation resolution
- [ ] Include administrators
- [ ] Restrict force pushes
- [ ] Allow deletions: Disabled

### Access Control
- [ ] Collaborator list reviewed
- [ ] No unnecessary admin access
- [ ] Repository visibility: Private (recommended for now)

---

## Post-Configuration Steps

### 1. Test Secret Scanning

Try committing a fake secret:
```bash
# In a test branch
echo "STRIPE_SECRET_KEY=sk_test_fake123" > test-secret.txt
git add test-secret.txt
git commit -m "test: secret detection"
git push origin test-branch
```

**Expected Result**: Push should be blocked by push protection ✓

### 2. Test Branch Protection

Try pushing directly to main:
```bash
git checkout main
echo "test" > test.txt
git add test.txt
git commit -m "test: branch protection"
git push origin main
```

**Expected Result**: Push should be rejected (requires PR) ✓

### 3. Monitor Security Tab

Go to: https://github.com/Luahoa/v-edfinance/security

Should show:
```
Security overview
✓ No vulnerabilities found
✓ Secret scanning: 0 alerts
✓ Dependabot: 0 alerts
✓ Code scanning: (if enabled)
```

---

## Troubleshooting

### Secret Scanning Not Working?

**Check**:
- Repository must be private with GitHub Advanced Security, or public
- Settings → Code security → Verify "Enabled"
- Wait 5-10 minutes for initial scan

### Branch Protection Not Applied?

**Check**:
- Pattern must exactly match: `main` (case-sensitive)
- You must be repository admin
- Test by trying to push directly to main

### Dependabot Alerts Not Showing?

**Check**:
- Dependencies must be declared in package.json
- Wait up to 24 hours for initial scan
- Check Settings → Security → Dependabot alerts

---

## Security Best Practices

### For Development

1. **Never commit secrets** - Use .env files (in .gitignore)
2. **Always create PRs** - Even for small changes
3. **Resolve all conversations** - Before merging PRs
4. **Keep dependencies updated** - Merge Dependabot PRs regularly

### For Production

1. **Rotate secrets** - If ever exposed
2. **Review security alerts** - Weekly
3. **Audit access** - Monthly
4. **Update branch protection** - As team grows

---

## Quick Commands Reference

### Check GitHub Security Features via CLI

```bash
# Install GitHub CLI first: https://cli.github.com/
gh auth login

# Check secret scanning status
gh api repos/Luahoa/v-edfinance/secret-scanning/alerts

# Check Dependabot alerts
gh api repos/Luahoa/v-edfinance/dependabot/alerts

# Check branch protection
gh api repos/Luahoa/v-edfinance/branches/main/protection
```

---

## Documentation Links

- **Secret Scanning**: https://docs.github.com/en/code-security/secret-scanning
- **Push Protection**: https://docs.github.com/en/code-security/secret-scanning/push-protection
- **Branch Protection**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- **Dependabot**: https://docs.github.com/en/code-security/dependabot

---

## Completion Checklist

When done, update [GITHUB_SECURITY_CLEANUP_EXECUTION_SUMMARY.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/GITHUB_SECURITY_CLEANUP_EXECUTION_SUMMARY.md):

- [x] Secret scanning enabled
- [x] Push protection enabled  
- [x] Dependabot alerts enabled
- [x] Dependabot security updates enabled
- [x] Branch protection configured for main
- [x] Repository access reviewed
- [x] Security features tested

**After completion**: Mark Phase 4 as complete in SECRETS_ROTATION.md

---

**Prepared by**: Amp Security Agent  
**Last Updated**: 2026-01-05  
**Estimated Time**: 15 minutes  
**Difficulty**: Easy (point-and-click)
