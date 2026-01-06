# Secret Rotation Log

This document tracks all security incidents and secret rotations for V-EdFinance.

---

## 2026-01-05: SSH Key Rotation (Critical Security Incident)

### Incident Summary

**Issue**: SSH private key (`amp_vps_private_key.txt`) was committed to git repository  
**Severity**: 🔴 **CRITICAL**  
**Discovery Date**: 2026-01-05  
**Resolution Date**: 2026-01-05  
**Impact**: VPS access credentials exposed in version control

### Timeline

| Time | Action |
|------|--------|
| 2026-01-05 09:00 | Security audit identified SSH key in git history (commit 09ea34f) |
| 2026-01-05 09:15 | Key moved to `~/.ssh/` directory (working tree) |
| 2026-01-05 09:20 | **CRITICAL**: Key still in git history - full removal required |
| 2026-01-05 10:00 | Initiated comprehensive security cleanup |
| 2026-01-05 10:30 | Created mirror backup of repository |
| 2026-01-05 10:45 | Removed key from git history using git-filter-repo |
| 2026-01-05 11:00 | Force pushed cleaned history to GitHub |
| 2026-01-05 11:15 | Deleted merged branches (spike/simplified-nav, main-backup-2026-01-05) |
| 2026-01-05 11:30 | Created SECURITY.md and hardened .gitignore |
| 2026-01-05 11:45 | Generated new SSH key (vps_new_key) |
| 2026-01-05 12:00 | **PENDING**: Deploy new key to VPS (connection issue) |

### Actions Taken

#### 1. Git History Cleanup ✅

**Method**: git-filter-repo (BFG Repo-Cleaner alternative)

```bash
# Backup repository
cd ..
git clone --mirror https://github.com/Luahoa/v-edfinance.git v-edfinance-backup

# Remove sensitive file from all history
cd v-edfinance-backup
git filter-repo --path amp_vps_private_key.txt --invert-paths --force

# Verify removal
git log --all --oneline -- "amp_vps_private_key.txt"
# Output: (empty) ✓

# Force push cleaned history
git remote add origin https://github.com/Luahoa/v-edfinance.git
git push origin --force --all
git push origin --force --tags
```

**Result**: 
- ✅ File completely removed from git history
- ✅ All team members must run: `git pull --force`
- ✅ Backup stored in `../v-edfinance-backup/`

#### 2. SSH Key Generation ✅

**New Key Details**:
- **Type**: ed25519 (more secure than RSA)
- **Location**: `C:\Users\luaho\.ssh\vps_new_key`
- **Public Key**: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHJB6LmszlXL0KRmZo5wS4M2koOTWMoiw9LXI2JoVjAo amp-agent-new@v-edfinance`
- **Comment**: `amp-agent-new@v-edfinance`

**Old Key**:
- **Location**: `C:\Users\luaho\.ssh\amp_vps_private_key` 
- **Status**: ⚠️ Compromised - Must be revoked after new key deployed
- **Exposure Duration**: Unknown (in git since commit 63db100)

#### 3. VPS Deployment Scripts Created ✅

**Scripts**:
- `scripts/vps-toolkit/deploy-ssh-key-rotation.bat`: Deploy new key to VPS
- `scripts/vps-toolkit/revoke-old-ssh-key.bat`: Revoke old compromised key
- `scripts/vps-toolkit/vps-connection.js`: Already configured to use new key

**Deployment Status**: ⚠️ PENDING
- Issue: VPS SSH connection timeout
- Cause: Network/firewall or SSH service issue
- Resolution: Manual deployment required

#### 4. Security Documentation Created ✅

**Files Created**:
- `SECURITY.md`: Comprehensive security policy and incident response guide
- `.env.example`: Environment variable template (no secrets)
- `.gitignore`: Enhanced with comprehensive secret patterns

**Security Patterns Added to .gitignore**:
```gitignore
# Environment files
.env*
*.env

# SSH Keys  
*.pem, *.key, *.ppk
id_rsa, id_ed25519
*_private_key*
vps_*.key

# API Keys & Secrets
*secret*, *token*, *credentials*
secrets.json/yml

# Database dumps
*.sql, *.dump, *.backup

# Certificates
*.crt, *.p12, *.pfx
```

#### 5. Repository Cleanup ✅

**Branches Deleted**:
- `spike/simplified-nav` (local + remote) - Already merged to main
- `main-backup-2026-01-05` (local + remote) - Obsolete backup

**Current State**:
- Main branch: Clean and updated (commit b5a7e8e)
- Remote branches: Only `origin/main` remains
- Beads branches: `beads-sync` preserved (has unique commits)

### Verification

#### Git History Scan Results ✅

```bash
# Verify amp_vps_private_key.txt removed
git log --all --oneline -- "amp_vps_private_key.txt"
# Result: (empty) ✓

# Check for private key content
git log --all --source --full-history -S "PRIVATE KEY" --oneline
# Result: Only commit messages contain text (no actual keys) ✓

# Try to show deleted file
git show 09ea34f:amp_vps_private_key.txt
# Result: fatal: path does not exist ✓
```

**Conclusion**: ✅ No SSH private key content remains in git history

### Remaining Manual Steps

#### Step 1: Deploy New SSH Key to VPS (CRITICAL)

**When VPS connection is restored**:

```bash
# 1. Deploy new key
scripts\vps-toolkit\deploy-ssh-key-rotation.bat

# 2. Verify new key works
ssh -i C:\Users\luaho\.ssh\vps_new_key root@103.54.153.248 "echo 'Test OK'"

# 3. ONLY THEN revoke old key
scripts\vps-toolkit\revoke-old-ssh-key.bat

# 4. Delete old key locally
del C:\Users\luaho\.ssh\amp_vps_private_key
del C:\Users\luaho\.ssh\amp_vps_private_key.pub
```

**⚠️ CRITICAL**: Do NOT delete old key until new key is verified working!

#### Step 2: Update Team (if applicable)

If working with other developers:
```bash
# All team members must update their local repos
git fetch origin --prune
git reset --hard origin/main

# They will need the new VPS key (share securely via 1Password/LastPass)
```

### Impact Assessment

**Exposure Risk**: 
- 🔴 **HIGH** - Private key was in public/private repository
- Exposure Duration: Unknown (commit 63db100 timestamp)
- Access Scope: Anyone with repository access could extract the key

**Mitigation**:
- ✅ Key removed from git history (complete)
- ⚠️ Old key rotation pending (VPS connection issue)
- ✅ Enhanced security controls (.gitignore, SECURITY.md)
- ✅ Monitoring: GitHub secret scanning to be enabled (Phase 4)

**Services Affected**:
- VPS: 103.54.153.248 (root access)
- Deployment pipeline: Uses SSH for VPS deployment

### Lessons Learned

1. **Prevention**: Never commit files matching `*key*`, `*secret*`, `.env*` patterns
2. **Detection**: Regular git history scans for secrets (automated)
3. **Response**: Immediate rotation + history cleanup (not just deletion)
4. **Documentation**: All incidents logged in SECRETS_ROTATION.md
5. **Automation**: Pre-commit hooks to prevent secret commits

### Related Security Enhancements

- Enhanced `.gitignore` with 70+ secret patterns
- Created `SECURITY.md` with vulnerability reporting
- Created `.env.example` template (no secrets)
- VPS toolkit scripts updated to use new key
- Backup repository preserved for rollback if needed

---

## Secret Rotation Checklist Template

Use this template for future secret rotations:

### Pre-Rotation
- [ ] Backup affected services/data
- [ ] Generate new credentials
- [ ] Test new credentials in staging
- [ ] Plan deployment window
- [ ] Notify team members

### Rotation
- [ ] Deploy new credentials to production
- [ ] Verify services work with new credentials
- [ ] Monitor for errors/issues
- [ ] Update documentation

### Post-Rotation
- [ ] Revoke old credentials
- [ ] Remove old credentials from all locations
- [ ] Update local development environments
- [ ] Document incident in this file
- [ ] Review how exposure happened
- [ ] Implement preventive measures

---

**Document Owner**: Security Team  
**Last Updated**: 2026-01-05  
**Next Review**: After VPS key rotation complete
