# VPS Firewall Recovery Guide

**Problem:** UFW firewall locked SSH access to VPS  
**VPS Provider:** TrumVPS  
**VPS IP:** 103.54.153.248

---

## Emergency Recovery Steps

### Option 1: TrumVPS Web Console (FASTEST)

1. **Access TrumVPS control panel:**
   - Login to your TrumVPS account
   - Navigate to VPS management
   - Click "Console" or "VNC" button

2. **In web console, run:**
   ```bash
   # Login as root (use password: NzYFf8CN)
   
   # Disable firewall
   ufw disable
   
   # Verify SSH is accessible
   systemctl status ssh
   ```

3. **Test SSH from local:**
   ```bash
   ssh vps "echo 'SSH recovered'"
   ```

4. **Reconfigure firewall properly:**
   ```bash
   # Run the safe deployment script
   cd scripts/vps-toolkit
   node safe-deploy.js
   ```

---

### Option 2: TrumVPS Serial Console

If web console not available:

1. Access serial console from TrumVPS panel
2. Login as root
3. Run same commands as Option 1

---

### Option 3: TrumVPS Rescue Mode

1. Boot VPS into rescue mode from control panel
2. Mount root filesystem
3. Edit `/etc/ufw/ufw.conf`:
   ```
   ENABLED=no
   ```
4. Reboot to normal mode

---

### Option 4: Contact TrumVPS Support

If console not accessible:

- **Support email:** support@trumvps.com (check your account for exact email)
- **Request:** Disable UFW firewall or add SSH rule
- **Provide:** VPS IP, account details

---

## Prevention (Already Implemented)

The `safe-deploy.js` script now:

1. ✅ Configures ALL firewall rules BEFORE enabling UFW
2. ✅ Verifies SSH access after each firewall change
3. ✅ Logs all actions for debugging
4. ✅ Fails fast if SSH is locked out

**Never run these commands again:**
```bash
# ❌ DANGEROUS - Enables firewall before configuring SSH
ufw --force enable

# ✅ SAFE - Configure first, then enable
ufw allow 22/tcp
echo "y" | ufw enable
```

---

## How to Use This Guide

**For Human:**
1. Login to TrumVPS control panel
2. Open web console
3. Disable firewall: `ufw disable`
4. Inform agent that SSH is restored

**For Agent:**
Once human confirms SSH is restored:
```javascript
// Run safe deployment
const deployer = require('./safe-deploy');
await deployer.deploy();
```

---

**Created:** 2026-01-05  
**Agent:** Amp  
**Purpose:** Prevent future firewall lockouts
