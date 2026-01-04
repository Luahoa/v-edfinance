# Quick SSH Fix Commands for VPS

**Copy-paste these commands vào VPS terminal (Bitvise):**

```bash
# === Quick Fix (Copy toàn bộ block này) ===

echo "=== Fixing SSH Permissions ==="

# 1. Fix directory permissions
chmod 700 /root/.ssh
echo "✓ Directory permissions: 700"

# 2. Fix authorized_keys permissions
chmod 600 /root/.ssh/authorized_keys
echo "✓ Authorized keys permissions: 600"

# 3. Fix ownership
chown -R root:root /root/.ssh
echo "✓ Ownership: root:root"

# 4. Enable PubkeyAuthentication
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
echo "✓ PubkeyAuthentication enabled"

# 5. Set PermitRootLogin
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
echo "✓ PermitRootLogin configured"

# 6. Restart SSH
systemctl restart sshd 2>/dev/null || service ssh restart
echo "✓ SSH daemon restarted"

# 7. Verify
echo ""
echo "=== Verification ==="
ls -la /root/.ssh/
echo ""
echo "Keys installed: $(wc -l < /root/.ssh/authorized_keys)"
echo ""
echo "=== Fix Complete! ==="
echo "Test from Windows: ssh vps \"echo Success\""
```

---

## Or Step-by-Step (if block fails):

```bash
# Step 1
chmod 700 /root/.ssh

# Step 2
chmod 600 /root/.ssh/authorized_keys

# Step 3
chown -R root:root /root/.ssh

# Step 4
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Step 5
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

# Step 6
systemctl restart sshd

# Step 7 - Verify
ls -la /root/.ssh/
cat /root/.ssh/authorized_keys
```

---

## After Fix - Test from Windows:

```bash
# Test 1: Direct
ssh -i C:\Users\luaho\.ssh\amp_vps_key root@103.54.153.248 "echo Success"

# Test 2: With alias
ssh vps "echo Success && hostname"
```

---

**If you see "Success" - SSH is working! ✅**
