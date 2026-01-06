# VPS SSH Authentication Troubleshooting Guide

## Current Status

✅ SSH key exists: `C:\Users\luaho\.ssh\amp_vps_key`  
✅ Key type: OpenSSH ED25519  
✅ Key has no passphrase  
✅ Public key can be extracted  
✅ VPS permissions fixed (700/600)  
❌ **ssh2 library authentication failing**

## Root Cause Analysis

**Problem:** `All configured authentication methods failed`

**Possible causes:**
1. Public key not properly added to VPS `/root/.ssh/authorized_keys`
2. Key format mismatch between Windows and Linux
3. VPS SSH config blocking publickey auth
4. Authorized_keys file has wrong line breaks (Windows CRLF vs Linux LF)

## Solution Steps

### Step 1: Verify Public Key on VPS

**Run in VPS terminal (Bitvise):**

```bash
# Check if key exists
cat /root/.ssh/authorized_keys

# Expected output:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance
```

**If output is different or missing:**

```bash
# Recreate authorized_keys with correct key
cat > /root/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance
EOF

# Fix permissions
chmod 600 /root/.ssh/authorized_keys
chown root:root /root/.ssh/authorized_keys

# Verify
cat /root/.ssh/authorized_keys
```

### Step 2: Check SSH Daemon Config

```bash
# Check if publickey auth is enabled
grep "^PubkeyAuthentication" /etc/ssh/sshd_config

# Should output:
# PubkeyAuthentication yes

# If not, fix it:
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH
systemctl restart sshd
```

### Step 3: Check SSH Logs for Errors

```bash
# Monitor SSH auth attempts in real-time
tail -f /var/log/auth.log

# Then test connection from Windows
# Look for errors like:
# - "Authentication refused: bad ownership or modes"
# - "Invalid user root"
# - "Could not open authorized keys"
```

### Step 4: Test with Native SSH First

**Before using ssh2 library, verify native SSH works:**

```powershell
# Windows PowerShell
ssh -i C:\Users\luaho\.ssh\amp_vps_key -v root@103.54.153.248 "echo Success"
```

**If this works, then ssh2 config needs adjustment**  
**If this fails, permissions/key issue on VPS**

### Step 5: Fix Line Endings (if needed)

authorized_keys might have Windows line endings:

```bash
# Convert CRLF to LF
dos2unix /root/.ssh/authorized_keys

# Or manually:
sed -i 's/\r$//' /root/.ssh/authorized_keys

# Verify no carriage returns
cat -A /root/.ssh/authorized_keys
# Should NOT see ^M at end of lines
```

### Step 6: Advanced Debugging

**Enable SSH debug logging:**

```bash
# Edit sshd_config
nano /etc/ssh/sshd_config

# Change:
# LogLevel INFO
# To:
LogLevel DEBUG3

# Restart
systemctl restart sshd

# Watch logs
tail -f /var/log/auth.log
```

### Step 7: Alternative - Password Auth (Temporary)

**If key auth keeps failing, temporarily enable password:**

```bash
# ONLY FOR TESTING - DISABLE AFTER
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# Set root password
passwd root
# Enter new password

# Test from Windows
ssh root@103.54.153.248
```

**IMPORTANT:** Disable password auth after deployment:
```bash
sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

## Common Fixes

### Fix 1: Recreate authorized_keys from scratch

```bash
rm /root/.ssh/authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance" > /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
chown root:root /root/.ssh/authorized_keys
```

### Fix 2: Check SELinux (CentOS/RHEL only)

```bash
# If SELinux is enforcing
getenforce

# Restore context
restorecon -R /root/.ssh

# Or temporarily disable (testing only)
setenforce 0
```

### Fix 3: Verify key fingerprint matches

**On Windows:**
```powershell
ssh-keygen -lf C:\Users\luaho\.ssh\amp_vps_key
# Output: 256 SHA256:Emv7ruosypKMh6jd+nt5qBxfr0zvjAtliRYL6twm7e4
```

**On VPS:**
```bash
ssh-keygen -lf /root/.ssh/authorized_keys
# Should match the Windows output
```

## Verification Checklist

After fixes, verify:

- [ ] `/root/.ssh/` is `700` (drwx------)
- [ ] `/root/.ssh/authorized_keys` is `600` (-rw-------)
- [ ] Owner is `root:root`
- [ ] `PubkeyAuthentication yes` in `/etc/ssh/sshd_config`
- [ ] SSH daemon restarted
- [ ] No CRLF line endings in authorized_keys
- [ ] Native SSH works: `ssh -i key root@103.54.153.248 "echo test"`
- [ ] Key fingerprints match between Windows and VPS

## Next Steps

1. **Verify native SSH works first**
2. **If native SSH works but ssh2 fails:** Check ssh2 config (passphrase, algorithms)
3. **If native SSH fails:** Fix VPS permissions/config
4. **Last resort:** Use password auth temporarily for deployment, fix keys later

---

**Created:** 2026-01-05  
**Status:** Troubleshooting active  
**Priority:** 🔴 Blocking all VPS deployment
