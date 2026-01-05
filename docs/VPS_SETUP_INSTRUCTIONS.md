# VPS Setup Instructions - URGENT ACTION REQUIRED

**Status:** 🔴 SSH Access Not Working  
**Issue:** Public key not added to VPS  
**Action Required:** Manual intervention needed

---

## Problem Diagnosis

✅ **SSH Key Generated:** `C:\Users\luaho\.ssh\amp_vps_key` (ED25519, 256-bit)  
✅ **Public Key Available:** `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b`  
✅ **VPS Reachable:** Ping successful (53-67ms latency)  
❌ **SSH Access:** Permission denied (publickey,password)

**Root Cause:** Public key not in `/root/.ssh/authorized_keys` on VPS

---

## SOLUTION: Add Public Key to VPS

### Method 1: Using VPS Control Panel (RECOMMENDED)

1. **Login to VPS provider dashboard** (e.g., DigitalOcean, Vultr, AWS)
2. **Access VPS console** (browser-based terminal)
3. **Run these commands:**

```bash
# Create .ssh directory if not exists
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Add public key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance" >> /root/.ssh/authorized_keys

# Set correct permissions
chmod 600 /root/.ssh/authorized_keys

# Verify
cat /root/.ssh/authorized_keys
```

### Method 2: Using Password (if password auth enabled)

```bash
# Copy public key to clipboard first
type "C:\Users\luaho\.ssh\amp_vps_key.pub"

# Then use ssh-copy-id (if available on Windows)
ssh-copy-id -i "C:\Users\luaho\.ssh\amp_vps_key.pub" root@103.54.153.248
```

### Method 3: Manual File Transfer (if you have VPS password)

```bash
# Login with password
ssh root@103.54.153.248

# Then run the commands from Method 1
```

---

## Verification After Adding Key

Run this command to test SSH access:

```bash
ssh -i "C:\Users\luaho\.ssh\amp_vps_key" root@103.54.153.248 "echo 'SSH Working!' && hostname"
```

**Expected output:**
```
SSH Working!
ubuntu-vedfinance (or similar hostname)
```

---

## Post-Verification: Setup SSH Config

Once SSH access works, create `C:\Users\luaho\.ssh\config`:

```
Host vps-vedfinance
    HostName 103.54.153.248
    User root
    IdentityFile C:\Users\luaho\.ssh\amp_vps_key
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking accept-new

# Short alias
Host vps
    HostName 103.54.153.248
    User root
    IdentityFile C:\Users\luaho\.ssh\amp_vps_key
    IdentitiesOnly yes
    ServerAliveInterval 60
```

**Then you can connect easily:**
```bash
ssh vps-vedfinance
# or
ssh vps
```

---

## Why SSH Config is Essential for This Project

### 1. **Simplicity**
```bash
# Without config (current - tedious)
ssh -i "C:\Users\luaho\.ssh\amp_vps_key" root@103.54.153.248

# With config (1 word!)
ssh vps
```

### 2. **Consistency**
All deployment scripts can use `vps` alias instead of full connection strings.

### 3. **Connection Stability**
- `ServerAliveInterval 60` - Keeps connection alive
- `ServerAliveCountMax 3` - Prevents timeout during long operations

### 4. **SCP/RSYNC Simplification**
```bash
# Without config
scp -i "C:\Users\luaho\.ssh\amp_vps_key" file.txt root@103.54.153.248:/path/

# With config
scp file.txt vps:/path/
```

### 5. **Automation Scripts**
Deployment scripts become portable:
```bash
#!/bin/bash
ssh vps "docker ps"                    # Works anywhere
scp docker-compose.yml vps:/root/      # Clean syntax
```

---

## Next Steps (In Order)

1. ✅ **FIRST:** Add public key to VPS (use Method 1)
2. ✅ **VERIFY:** Test SSH connection works
3. ✅ **CREATE:** SSH config file at `C:\Users\luaho\.ssh\config`
4. ✅ **TEST:** Run `ssh vps` to verify alias works
5. ✅ **PROCEED:** Continue with deployment plan

---

## Security Notes

- ✅ ED25519 key is modern and secure (256-bit)
- ✅ Private key stored locally only (`C:\Users\luaho\.ssh\amp_vps_key`)
- ✅ Never commit private key to git
- ✅ Public key can be safely shared

---

## Troubleshooting

### If SSH still fails after adding key:

```bash
# Check SSH with verbose output
ssh -v -i "C:\Users\luaho\.ssh\amp_vps_key" root@103.54.153.248

# Check key permissions on VPS (via console)
ls -la /root/.ssh/
# Should show:
# drwx------  2 root root   4096 ... .ssh/
# -rw-------  1 root root    104 ... authorized_keys
```

### Common Issues:

1. **Wrong permissions:** `chmod 600 /root/.ssh/authorized_keys`
2. **SELinux blocking:** `restorecon -R /root/.ssh` (if SELinux enabled)
3. **SSH daemon config:** Check `/etc/ssh/sshd_config` has `PubkeyAuthentication yes`

---

**Created:** 2026-01-05  
**Priority:** 🔴 CRITICAL - Blocks all deployment work  
**Action:** User must add public key to VPS before proceeding
