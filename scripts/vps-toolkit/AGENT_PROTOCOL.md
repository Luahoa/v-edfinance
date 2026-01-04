# VPS Deployment Agent Protocol

**MANDATORY RULES for all agents working with VPS**

---

## 🚨 CRITICAL: Firewall Safety Protocol

### Rule 1: NEVER enable firewall before configuring SSH

```bash
# ❌ FORBIDDEN - Will lock you out
ufw --force enable

# ❌ FORBIDDEN - Multi-line with continuation
ssh vps "ufw enable && \
ufw allow 22/tcp"

# ✅ CORRECT - Configure THEN enable
ssh vps "ufw allow 22/tcp; echo 'y' | ufw enable"
```

### Rule 2: ALWAYS use safe-deploy.js for infrastructure changes

```bash
# ✅ CORRECT way to deploy
cd scripts/vps-toolkit
node safe-deploy.js

# ❌ WRONG - Manual firewall commands
ssh vps "ufw allow 80/tcp"
```

### Rule 3: ALWAYS verify SSH after firewall changes

```javascript
// Built into safe-deploy.js:
async verifySSHAccess() {
  const result = await this.vps.exec('echo "SSH OK"');
  if (!result.stdout.includes('SSH OK')) {
    throw new Error('SSH locked out!');
  }
}
```

---

## 📋 Deployment Checklist

### Before Starting ANY VPS work:

- [ ] Read `scripts/vps-toolkit/README.md`
- [ ] Verify VPS toolkit is working: `cd scripts/vps-toolkit && npm test`
- [ ] Check current VPS status: `node -e "const VPS = require('./vps-connection'); (async () => { const v = new VPS(); await v.connect(); console.log(await v.getSystemInfo()); v.disconnect(); })()"`

### During Deployment:

- [ ] Use `safe-deploy.js` orchestrator (includes safety checks)
- [ ] Monitor deployment logs
- [ ] Test SSH after each infrastructure change
- [ ] Save deployment logs to `history/vps-deployment/`

### After Deployment:

- [ ] Verify all services running: `docker ps`
- [ ] Check firewall status: `ssh vps "ufw status numbered"`
- [ ] Test monitoring endpoints (Netdata, Grafana, etc.)
- [ ] Create beads issue with deployment summary

---

## 🛠️ VPS Toolkit Usage

### Available Tools

1. **VPSConnection class** - Low-level SSH operations
   ```javascript
   const VPSConnection = require('./vps-connection');
   const vps = new VPSConnection();
   await vps.connect();
   await vps.exec('docker ps');
   vps.disconnect();
   ```

2. **SafeVPSDeployer class** - High-level deployment orchestration
   ```javascript
   const SafeVPSDeployer = require('./safe-deploy');
   const deployer = new SafeVPSDeployer();
   await deployer.deploy(); // Full deployment
   ```

3. **exec-command.js** - CLI tool for single commands
   ```bash
   node exec-command.js "docker ps"
   ```

4. **test-connection.js** - Health check
   ```bash
   npm test
   ```

### When to Use Each

| Task | Tool | Example |
|------|------|---------|
| Single command | exec-command.js | `node exec-command.js "uptime"` |
| Health check | test-connection.js | `npm test` |
| File upload | VPSConnection | `vps.uploadFile('./file', '/remote')` |
| Full deployment | SafeVPSDeployer | `deployer.deploy()` |
| Custom script | VPSConnection | Create new script in vps-toolkit/ |

---

## 🔧 Troubleshooting

### "SSH connection timeout"

**Check:**
1. VPS is running (TrumVPS control panel)
2. Firewall allows port 22: `ssh vps "ufw status | grep 22"`
3. SSH service running: `ssh vps "systemctl status ssh"`

**Recovery:**
Follow `FIREWALL_RECOVERY.md`

### "Authentication failed"

**Check:**
1. SSH key exists: `ls ~/.ssh/amp_vps_key`
2. Key has correct permissions: `icacls ~/.ssh/amp_vps_key`
3. Public key on VPS: `ssh vps "cat ~/.ssh/authorized_keys"`

**Fix:**
Re-run key setup from previous thread

### "Tool invocation cancelled"

**Cause:** Long-running command (>5 min) timed out

**Solution:** Use VPSConnection with progress callbacks:
```javascript
const result = await vps.exec('apt-get update', {
  onStdout: (data) => console.log('Progress:', data.toString())
});
```

---

## 📁 File Organization

```
scripts/vps-toolkit/
├── README.md                    # User documentation
├── FIREWALL_RECOVERY.md         # Emergency recovery
├── AGENT_PROTOCOL.md            # This file (agent rules)
├── vps-connection.js            # Core VPS class
├── safe-deploy.js               # Safe deployment orchestrator
├── exec-command.js              # CLI tool
├── test-connection.js           # Health check
├── .env                         # VPS credentials (gitignored)
└── package.json                 # Dependencies
```

---

## 🎯 Success Metrics

### After following this protocol, you should achieve:

- ✅ Zero SSH lockouts from firewall misconfiguration
- ✅ 100% deployment success rate
- ✅ All deployments logged and traceable
- ✅ Recovery time <5 minutes if issues occur
- ✅ No manual VPS console access needed (except emergencies)

---

## 📚 Related Documentation

- [VPS Toolkit README](./README.md) - User guide
- [Deployment Master Plan](../../history/vps-deployment/DEPLOYMENT_MASTER_PLAN.md) - Full deployment strategy
- [DevOps Tools Inventory](../../DEVOPS_TOOLS_INVENTORY.md) - Tools reference
- [Discovery Report](../../history/vps-access-toolkit/discovery.md) - Problem analysis

---

**Version:** 1.0  
**Created:** 2026-01-05  
**Author:** Amp Agent  
**Purpose:** Prevent future VPS deployment failures  
**MANDATORY:** All agents MUST read this before VPS work
