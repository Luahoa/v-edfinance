# Discovery Report: VPS Access Toolkit for Coding Agents

**Date:** 2026-01-05  
**Problem:** Coding agents cannot SSH into VPS despite valid SSH keys  
**Goal:** Create permanent, bulletproof VPS access solution for all agents

---

## Architecture Snapshot

### Current VPS Stack
- **OS:** Ubuntu 22.04.1 LTS
- **IP:** 103.54.153.248
- **SSH:** Port 22, ED25519 keys
- **User:** root (deployer user to be created)

### Existing SSH Infrastructure
```
C:\Users\luaho\.ssh\
├── amp_vps_key (ED25519 private key, 411 bytes)
├── amp_vps_key.pub (public key)
└── config (✅ Created with vps alias)
```

### Current Tooling Attempts
1. **Native SSH** - Works from Windows CLI but coding agents timeout
2. **ssh2 library** (5,738⭐) - Installed, authentication failing
3. **Bitvise SSH Client** - Working (GUI only, not agent-accessible)

---

## Existing Patterns

### SSH Access Patterns in Codebase
- ❌ **No existing VPS SSH automation** - This is net new
- ✅ **GitHub CLI integration** - Successfully used for repo cloning
- ✅ **Bash tool available** - Can execute shell commands
- ✅ **Task tool available** - Can spawn sub-agents

### Similar Implementations (External)
- **Ansible** - Uses paramiko (Python), not applicable for Node.js
- **ssh2-promise** - Wrapper around ssh2, adds Promise API
- **simple-ssh** - Deprecated, uses ssh2 internally
- **node-ssh** - Modern wrapper (480⭐), built on ssh2

### Naming Conventions
- Scripts: `kebab-case.js` (`exec-command.js`)
- Modules: `PascalCase` classes (`VPSConnection`)
- Config: `UPPER_SNAKE_CASE` env vars (`VPS_HOST`)

---

## Technical Constraints

### Node.js Environment
- **Version:** v20.x (from turbo.json, package.json)
- **Package Manager:** pnpm (workspace setup)
- **Runtime:** Windows 11 (local), Ubuntu 22.04 (VPS)

### Key Dependencies (Already Available)
```json
{
  "ssh2": "^1.15.0",      // ✅ Installed in vps-toolkit
  "dotenv": "^16.4.1",    // ✅ Installed
  "node-ssh": "^13.2.0"   // ❌ Not yet tried (alternative)
}
```

### Build Requirements
- No build step needed (pure JS/Node)
- Works in both Amp agent context and standalone scripts

### VPS Constraints
- **Memory:** 4GB (enough for Docker + monitoring)
- **Disk:** ~30GB available
- **Network:** Firewall blocks all except allowed ports
- **SSH:** PubkeyAuthentication enabled, PasswordAuthentication disabled

---

## Current Blockers

### Issue 1: ssh2 Authentication Failure
**Error:** "All configured authentication methods failed"

**Debugging Done:**
- ✅ Public key is in `/root/.ssh/authorized_keys`
- ✅ Permissions are correct (700/.ssh, 600/authorized_keys)
- ✅ PubkeyAuthentication enabled in sshd_config
- ✅ SSH daemon restarted
- ✅ Key has no passphrase
- ✅ Key fingerprint verified
- ❓ **Hypothesis:** ssh2 library config issue or algorithm mismatch

**Not Yet Tested:**
1. Native OpenSSH from Bash tool (bypassing agent timeout)
2. Alternative library (node-ssh, ssh2-promise)
3. Debug mode ssh2 with algorithm logging
4. Password auth fallback for initial setup

### Issue 2: Coding Agent Tool Timeouts
**Error:** Tool invocations get cancelled after ~5 minutes of inactivity

**Why it matters:**
- Long-running SSH commands (apt install, docker build) timeout
- Interactive prompts freeze agents
- Network latency causes silent failures

**Workarounds needed:**
- Async operations with progress callbacks
- Chunked command execution
- Heartbeat/keepalive mechanisms
- Non-blocking I/O

### Issue 3: No Fallback Mechanisms
**Gap:** If SSH fails, deployment is completely blocked

**Needed:**
1. Password auth fallback (temporary, for emergency)
2. Local script generation (user runs manually)
3. Web-based console integration (Bitvise API?)
4. Alternative transport (HTTP API to VPS relay service)

---

## External References

### Library Documentation
1. **ssh2** - [GitHub](https://github.com/mscdex/ssh2)
   - Pure JavaScript SSH2 implementation
   - Supports all key types (ED25519, RSA, ECDSA)
   - Low-level, requires careful config
   - **Cloned to:** `temp_indie_tools/ssh2/`

2. **node-ssh** - [npm](https://www.npmjs.com/package/node-ssh)
   - High-level wrapper around ssh2
   - Promise-based API
   - Built-in SFTP helpers
   - **Status:** Not yet tried

3. **ssh2-promise** - [npm](https://www.npmjs.com/package/ssh2-promise)
   - Promise wrapper for ssh2
   - Tunnel/SFTP support
   - **Status:** Alternative option

### Similar Projects
1. **Dokploy** - Uses Docker API, not SSH
2. **Coolify** - Uses SSH internally (PHP implementation)
3. **CapRover** - Uses Docker socket forwarding over SSH
4. **Kamal** - Ruby-based SSH deployment (not applicable)

### Best Practices
- **SSH Hardening:** Disable password auth, use keys only
- **Connection Pooling:** Reuse SSH connections for multiple commands
- **Error Handling:** Distinguish network vs auth vs command errors
- **Logging:** Structured logs for debugging agent failures

---

## Success Criteria

### Minimum Viable Product (MVP)
1. ✅ Coding agent can execute single command on VPS
2. ✅ Coding agent can upload/download files via SFTP
3. ✅ Connection failures have clear error messages
4. ✅ Toolkit works in both Amp agent and standalone script

### Production Ready
1. ✅ Multiple commands in sequence without reconnecting
2. ✅ Long-running commands (>5 min) with progress updates
3. ✅ Automatic reconnection on network failure
4. ✅ Comprehensive test suite with real VPS
5. ✅ Documentation for future agents

### Nice to Have
1. ⏳ Password auth fallback (emergency only)
2. ⏳ Connection pooling for performance
3. ⏳ Parallel command execution
4. ⏳ Interactive command support (with timeouts)

---

## Risk Assessment (Next Phase Input)

| Component | Current Status | Risk Level |
|-----------|---------------|------------|
| ssh2 library integration | Failing auth | 🔴 HIGH |
| VPS key setup | Working in Bitvise | 🟡 MEDIUM |
| Agent timeout handling | Unknown | 🟡 MEDIUM |
| SFTP file transfer | Not tested | 🟢 LOW |
| Command execution | Working in test | 🟢 LOW |
| Fallback mechanisms | Not implemented | 🟡 MEDIUM |

**HIGH risk items require spikes before proceeding.**

---

## Next Steps (Approach Phase)

1. **Spike 1:** Test node-ssh library (30 min)
2. **Spike 2:** Test native SSH via Bash tool with timeout handling (30 min)
3. **Spike 3:** Debug ssh2 algorithm mismatch (30 min)
4. **Oracle:** Synthesize spike results into recommended approach
5. **Decomposition:** Create beads for final toolkit implementation

---

**Generated:** 2026-01-05  
**Agent:** Amp (Planning Skill)  
**Next:** Synthesis phase with Oracle
