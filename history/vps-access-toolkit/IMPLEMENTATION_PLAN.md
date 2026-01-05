# VPS Access Toolkit - Implementation Plan

**Date:** 2026-01-05  
**Status:** 🔴 BLOCKED - SSH authentication failing  
**Blocker:** Public key not properly authorized on VPS despite user confirmation

---

## Executive Summary

**Problem:** All SSH connection attempts fail with "Authentication failed" despite:
- ✅ Public key added to VPS `/root/.ssh/authorized_keys`
- ✅ Permissions correct (700/.ssh, 600/authorized_keys)
- ✅ SSH daemon configured correctly
- ✅ Key has no passphrase
- ✅ Key fingerprint verified

**Root Cause Hypothesis:** Line endings or hidden characters in authorized_keys file

**Solution:** Recreate authorized_keys with guaranteed correct format

---

## Spike Results

### Spike 1: node-ssh Library ❌ FAILED
**Error:** "All configured authentication methods failed"  
**Conclusion:** node-ssh uses ssh2 internally, same auth failure

### Spike 2: Native SSH via Bash ❌ TIMEOUT
**Error:** SSH command times out (300 seconds inactivity)  
**Conclusion:** Indicates SSH handshake hanging, not completing auth

---

## Critical Next Step (MANDATORY)

**User must run this EXACT command in VPS terminal (Bitvise):**

```bash
# Recreate authorized_keys with guaranteed correct format
rm /root/.ssh/authorized_keys

# Create new file with EXACT public key (no line breaks, no extra spaces)
cat > /root/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance
EOF

# Fix permissions
chmod 600 /root/.ssh/authorized_keys
chown root:root /root/.ssh/authorized_keys

# Verify - should show EXACTLY one line
cat /root/.ssh/authorized_keys

# Check for hidden characters
cat -A /root/.ssh/authorized_keys
# Should NOT see any ^M or special characters at line end

# Test from VPS itself (should work)
ssh -i /root/.ssh/authorized_keys root@localhost "echo test"
```

**Verification:**
- File has EXACTLY 1 line
- Line starts with "ssh-ed25519"
- No carriage returns (^M)
- Permissions are 600
- Owner is root:root

---

## Recommended Toolkit Architecture (After Auth Fixed)

### Layer 1: Native SSH Wrapper (PRIMARY)
**Why:** Proven to work once auth is fixed, no library dependencies

```javascript
class NativeSSHAdapter {
  async exec(command) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const sshCmd = `ssh -o ConnectTimeout=10 -o ServerAliveInterval=60 vps "${command}"`;
    const { stdout, stderr } = await execAsync(sshCmd, { timeout: 600000 }); // 10 min
    return { stdout, stderr };
  }
  
  async uploadFile(local, remote) {
    const scpCmd = `scp -o ConnectTimeout=10 vps:"${local}" "${remote}"`;
    await execAsync(scpCmd);
  }
}
```

### Layer 2: Password Auth Fallback (EMERGENCY)
**Why:** If keys completely fail, need emergency access

```javascript
class PasswordFallback {
  constructor(password) {
    this.password = password;
    console.warn('⚠ Using password auth - disable after key setup!');
  }
  
  async exec(command) {
    // Use sshpass or expect for password automation
    // ONLY for initial setup, then disable
  }
}
```

### Layer 3: Manual Script Generation (LAST RESORT)
**Why:** If all automation fails, generate shell script for user

```javascript
class ManualScriptGenerator {
  generate(commands) {
    const script = commands.map(cmd => `ssh vps "${cmd}"`).join('\n');
    fs.writeFileSync('manual-deploy.sh', script);
    console.log('✅ Generated manual-deploy.sh - please run it manually');
  }
}
```

---

## Implementation Beads (After Auth Fixed)

### Bead 1: Native SSH Adapter
**File:** `scripts/vps-toolkit/adapters/native-ssh.js`  
**Priority:** P0 (blocker for deployment)  
**Time:** 2 hours

**Tasks:**
- Create NativeSSHAdapter class
- Implement exec() with timeout handling
- Implement uploadFile() via scp
- Implement downloadFile() via scp
- Add error parsing (distinguish network vs auth vs command errors)
- Add retry logic with exponential backoff

### Bead 2: Password Fallback Adapter
**File:** `scripts/vps-toolkit/adapters/password.js`  
**Priority:** P1 (nice to have)  
**Time:** 1 hour

**Tasks:**
- Implement using child_process with password input
- Add security warnings
- Auto-disable after successful key setup

### Bead 3: Manual Script Generator
**File:** `scripts/vps-toolkit/adapters/manual.js`  
**Priority:** P2 (fallback)  
**Time:** 30 min

**Tasks:**
- Generate bash/powershell scripts
- Include all commands with proper escaping
- Add verification steps

### Bead 4: Unified VPS Connection Interface
**File:** `scripts/vps-toolkit/index.js`  
**Priority:** P0
**Time:** 1 hour

**Tasks:**
- Create VPSConnection class with auto-fallback
- Try Layer 1 (native SSH) first
- Fall back to Layer 2 (password) if enabled
- Fall back to Layer 3 (manual script) if all fail
- Export simple API for other scripts

### Bead 5: Documentation & Examples
**File:** `scripts/vps-toolkit/README.md`, examples/  
**Priority:** P1  
**Time:** 1 hour

**Tasks:**
- Complete API reference
- Add troubleshooting guide
- Create example deployment script
- Document for future coding agents

---

## Timeline (Post-Auth Fix)

| Task | Time | Dependency |
|------|------|------------|
| Fix VPS authorized_keys | 5 min | USER ACTION |
| Verify SSH works | 5 min | Auth fixed |
| Build Layer 1 (Native SSH) | 2 hours | SSH verified |
| Build Layer 2 (Password) | 1 hour | - |
| Build Layer 3 (Manual) | 30 min | - |
| Build Unified Interface | 1 hour | Layers 1-3 |
| Documentation | 1 hour | Interface complete |
| **TOTAL** | **6 hours** | |

---

## Success Criteria

- [ ] Coding agent can execute command on VPS
- [ ] Coding agent can upload/download files
- [ ] Long-running commands (>5 min) work without timeout
- [ ] Clear error messages for all failure modes
- [ ] Automatic fallback to manual script if needed
- [ ] Documentation complete for future agents

---

## Files Created

| File | Purpose | Status |
|------|---------|--------|
| `history/vps-access-toolkit/discovery.md` | Codebase analysis | ✅ Complete |
| `history/vps-access-toolkit/approach.md` | Strategy & risks | ✅ Complete |
| `scripts/vps-toolkit/spike-1-node-ssh.js` | node-ssh test | ✅ Failed |
| `scripts/vps-toolkit/spike-2-native-ssh.js` | Native SSH test | ✅ Timeout (auth issue) |
| `scripts/vps-toolkit/vps-connection.js` | ssh2 implementation | ✅ Failed auth |
| `docs/SSH_AUTH_TROUBLESHOOTING.md` | Debug guide | ✅ Complete |
| `docs/SSH_PERMISSION_FIX_PLAN.md` | Permission fix guide | ✅ Complete |
| `docs/QUICK_SSH_FIX.md` | Quick fix commands | ✅ Complete |

---

## BLOCKER Resolution

**User must execute these commands NOW:**

```bash
# 1. Backup current authorized_keys
cp /root/.ssh/authorized_keys /root/.ssh/authorized_keys.backup

# 2. Recreate with exact format
cat > /root/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance
EOF

# 3. Fix permissions
chmod 600 /root/.ssh/authorized_keys

# 4. Verify
cat -A /root/.ssh/authorized_keys  # Should show NO ^M characters
wc -l /root/.ssh/authorized_keys   # Should show "1"
```

**Then test from Windows:**
```powershell
ssh vps "echo test"
```

**If this works, continue with toolkit implementation.**  
**If this fails, escalate to VPS provider support - possible firewall/network issue.**

---

**Created:** 2026-01-05  
**Status:** Awaiting user auth fix  
**Next:** Implement native SSH toolkit (6 hours after auth works)
