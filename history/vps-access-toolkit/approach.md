# Approach: VPS Access Toolkit for Coding Agents

**Date:** 2026-01-05  
**Discovery:** [discovery.md](discovery.md)  
**Status:** Ready for spike verification

---

## Gap Analysis

| Component | Have | Need | Gap |
|-----------|------|------|-----|
| **SSH Library** | ssh2 (low-level, failing auth) | Working SSH connection | ❌ Library config or alternative needed |
| **Command Execution** | Basic exec() method | Long-running commands, progress | ❌ Timeout handling, streaming output |
| **File Transfer** | SFTP methods (not tested) | Reliable upload/download | 🟡 Needs verification |
| **Error Handling** | Generic exceptions | Actionable error messages | ❌ Distinguish auth vs network vs command errors |
| **Fallback** | None | Emergency access method | ❌ Password auth or manual script generation |
| **Documentation** | Partial README | Complete agent guide | 🟡 Needs expansion |

---

## Recommended Approach

### Strategy: **Three-Layer Fallback Architecture**

```
Layer 1 (Primary):   node-ssh library → High-level, proven wrapper
Layer 2 (Fallback):  Native SSH via Bash → Bypass agent limitations  
Layer 3 (Emergency): Password auth + manual script → Last resort
```

**Rationale:**
1. **node-ssh** is a battle-tested wrapper around ssh2 with better defaults
2. **Native SSH** bypasses library issues, uses Windows OpenSSH directly
3. **Password auth** for initial setup or when keys completely fail

---

## Alternative Approaches

### Option A: Fix ssh2 Configuration (REJECTED)
**Approach:** Debug current ssh2 setup, fix algorithm mismatch  
**Pros:**
- Already installed, no new dependencies
- Most control over SSH connection

**Cons:**
- Time-consuming debugging (auth failure not clear)
- Low-level API requires more code
- Risk: May not fix underlying agent timeout issue

**Verdict:** ❌ **Too risky** - Unknown root cause, high time cost

### Option B: Use node-ssh Wrapper (RECOMMENDED)
**Approach:** Replace ssh2 with node-ssh, which handles config automatically  
**Pros:**
- Promise-based API (better for agents)
- Auto-handles algorithms, key formats
- Built-in retry logic
- Better error messages

**Cons:**
- Additional dependency (minor)
- Less control than raw ssh2

**Verdict:** ✅ **PRIMARY CHOICE** - Best balance of reliability and simplicity

### Option C: Native SSH Only (BACKUP)
**Approach:** Shell out to Windows OpenSSH via Bash tool  
**Pros:**
- Proven to work (native ssh command successful)
- No library dependencies
- Agent timeout can be handled with separate process

**Cons:**
- Platform-dependent (Windows/Linux differences)
- Harder to parse structured output
- No built-in SFTP (must use scp)

**Verdict:** 🟡 **FALLBACK LAYER** - Use if node-ssh fails

---

## Risk Map

| Component | Risk | Reason | Verification |
|-----------|------|--------|--------------|
| **node-ssh library** | 🟡 MEDIUM | Not yet tested, might have same issue as ssh2 | Spike 1: Test connection |
| **Native SSH via Bash** | 🟢 LOW | Already works, just need timeout handling | Spike 2: Test with Bash tool |
| **Agent timeout handling** | 🟡 MEDIUM | Unknown if long commands will timeout | Spike 2: Test 5+ min command |
| **SFTP file transfer** | 🟢 LOW | Standard feature in both node-ssh and native | Test in Spike 1 |
| **Error messaging** | 🟢 LOW | Straightforward implementation | Build during decomposition |
| **Password auth fallback** | 🟢 LOW | Standard SSH feature | Document, don't spike |

---

## Spikes Required (Phase 3)

### Spike 1: node-ssh Library Test
**Time-box:** 30 minutes  
**Question:** Does node-ssh library successfully connect to VPS?

**Tasks:**
1. Install node-ssh: `pnpm add node-ssh`
2. Create `test-node-ssh.js` based on docs
3. Test connection, command execution, SFTP upload
4. Document success/failure with error details

**Success Criteria:**
- [ ] Connection established
- [ ] Command executed: `echo "Hello from node-ssh"`
- [ ] File uploaded via SFTP
- [ ] Error messages are actionable (if fails)

**Output:** `.spikes/vps-access/spike-1-node-ssh/`

---

### Spike 2: Native SSH via Bash Tool
**Time-box:** 30 minutes  
**Question:** Can Bash tool execute SSH commands without timing out?

**Tasks:**
1. Test short command: `ssh vps "echo test"`
2. Test long command: `ssh vps "sleep 360 && echo done"` (6 min)
3. Test SFTP via scp: `scp file.txt vps:/root/`
4. Measure latency and identify timeout threshold

**Success Criteria:**
- [ ] Short command works reliably
- [ ] Long command either completes or fails gracefully
- [ ] scp file transfer works
- [ ] Timeout behavior documented

**Output:** `.spikes/vps-access/spike-2-native-ssh/`

---

### Spike 3: ssh2 Debug (OPTIONAL - Only if Spikes 1&2 fail)
**Time-box:** 30 minutes  
**Question:** What exact algorithm/config issue is causing ssh2 failure?

**Tasks:**
1. Enable ssh2 debug mode
2. Compare algorithms offered vs VPS accepted
3. Test with explicit algorithm config
4. Document exact error in auth handshake

**Success Criteria:**
- [ ] Root cause identified
- [ ] Fix documented (or confirmed unfixable)

**Output:** `.spikes/vps-access/spike-3-ssh2-debug/`

---

## Implementation Plan (Post-Spikes)

### Layer 1: node-ssh (Primary)
```javascript
const { NodeSSH } = require('node-ssh');

class VPSConnection {
  async connect() {
    this.ssh = new NodeSSH();
    await this.ssh.connect({
      host: '103.54.153.248',
      username: 'root',
      privateKeyPath: 'C:\\Users\\luaho\\.ssh\\amp_vps_key'
    });
  }
  
  async exec(command) {
    return await this.ssh.execCommand(command);
  }
  
  async uploadFile(local, remote) {
    return await this.ssh.putFile(local, remote);
  }
}
```

### Layer 2: Native SSH Fallback
```javascript
async execViaShell(command) {
  return await Bash.exec(`ssh vps "${command}"`);
}

async uploadViaShell(local, remote) {
  return await Bash.exec(`scp "${local}" vps:"${remote}"`);
}
```

### Layer 3: Error Recovery
```javascript
async connectWithFallback() {
  try {
    await this.connectNodeSSH();  // Layer 1
  } catch (err) {
    console.warn('node-ssh failed, trying native SSH');
    await this.testNativeSSH();  // Layer 2
    if (!this.nativeSSHWorks) {
      throw new Error('All SSH methods failed. See docs/SSH_AUTH_TROUBLESHOOTING.md');
    }
  }
}
```

---

## Toolkit Architecture

```
scripts/vps-toolkit/
├── index.js              # Main entry, exports VPSConnection
├── adapters/
│   ├── node-ssh.js       # Layer 1: node-ssh wrapper
│   ├── native-ssh.js     # Layer 2: Bash tool wrapper
│   └── password.js       # Layer 3: Emergency password auth
├── utils/
│   ├── error-handler.js  # Parse and format errors
│   ├── logger.js         # Structured logging
│   └── retry.js          # Exponential backoff
├── test-connection.js    # Verification script
├── exec-command.js       # CLI tool
└── README.md             # Agent-friendly documentation
```

---

## Acceptance Criteria

### For Layer 1 (node-ssh)
- [ ] Connects to VPS in <5 seconds
- [ ] Executes command and returns stdout/stderr
- [ ] Uploads file >1MB successfully
- [ ] Downloads file successfully
- [ ] Handles network disconnect gracefully
- [ ] Error messages include remediation steps

### For Layer 2 (native SSH)
- [ ] Falls back automatically if Layer 1 fails
- [ ] Executes commands via Bash tool
- [ ] File transfer via scp works
- [ ] Timeout configurable (default 10 min)
- [ ] Works on both Windows and Linux

### For Layer 3 (password auth)
- [ ] Documented in troubleshooting guide
- [ ] Only used when explicitly enabled
- [ ] Auto-disabled after successful key setup
- [ ] Warns user about security implications

---

## Timeline Estimate

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| **Spike 1** | Test node-ssh | 30 min | - |
| **Spike 2** | Test native SSH | 30 min | - |
| **Spike 3** | Debug ssh2 (if needed) | 30 min | Spikes 1&2 fail |
| **Build** | Implement multi-layer toolkit | 2 hours | Spike results |
| **Test** | E2E tests on real VPS | 1 hour | Build complete |
| **Docs** | Agent documentation | 30 min | Tests pass |
| **TOTAL** | | **4.5 hours** | |

---

## Key Learnings (Will be embedded in beads)

1. **ssh2 library** requires explicit algorithm config (ED25519 not default)
2. **Native SSH** works but requires shell escaping
3. **Agent timeouts** can be worked around with async + callbacks
4. **Fallback layers** critical for reliability (production requirement)

---

## Next Steps

1. ✅ **Run Spike 1:** Test node-ssh (30 min)
2. ✅ **Run Spike 2:** Test native SSH (30 min)
3. 🔄 **Synthesize Results:** Update this document with learnings
4. 🔄 **Create Beads:** Decompose into tasks with file scopes
5. 🔄 **Validate Plan:** Run bv analysis
6. 🔄 **Execute:** Deploy toolkit via orchestrator

---

**Created:** 2026-01-05  
**Recommended Approach:** Three-layer fallback (node-ssh → native → password)  
**Risk Level:** MEDIUM (spikes will reduce to LOW)  
**Next:** Execute Spike 1 (node-ssh test)
