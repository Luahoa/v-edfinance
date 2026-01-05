#!/bin/bash
# SSH Permission Auto-Fix Script for V-EdFinance VPS
# Safe to run multiple times (idempotent)
# Usage: bash fix-ssh-permissions.sh

set -e  # Exit on error

echo "=============================================="
echo "SSH Permission Fix Script"
echo "V-EdFinance VPS Setup"
echo "=============================================="
echo "Starting at: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create .ssh directory
echo -e "${YELLOW}[1/7]${NC} Creating /root/.ssh directory..."
mkdir -p /root/.ssh
echo -e "${GREEN}✓${NC} Directory ready"

# Step 2: Fix directory permissions
echo -e "${YELLOW}[2/7]${NC} Setting directory permissions to 700..."
chmod 700 /root/.ssh
echo -e "${GREEN}✓${NC} Set to drwx------ (700)"

# Step 3: Create/fix authorized_keys
echo -e "${YELLOW}[3/7]${NC} Checking authorized_keys file..."
if [ ! -f /root/.ssh/authorized_keys ]; then
    echo -e "${YELLOW}⚠${NC} File not found, creating..."
    touch /root/.ssh/authorized_keys
fi
chmod 600 /root/.ssh/authorized_keys
echo -e "${GREEN}✓${NC} Set to -rw------- (600)"

# Step 4: Fix ownership
echo -e "${YELLOW}[4/7]${NC} Setting ownership to root:root..."
chown -R root:root /root/.ssh
echo -e "${GREEN}✓${NC} Ownership set"

# Step 5: Fix SSH daemon config
echo -e "${YELLOW}[5/7]${NC} Configuring SSH daemon..."

# Enable PubkeyAuthentication
if grep -q "^PubkeyAuthentication" /etc/ssh/sshd_config; then
    sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
else
    echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config
fi

# Set PermitRootLogin to allow key-based login
if grep -q "^PermitRootLogin" /etc/ssh/sshd_config; then
    sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
else
    echo "PermitRootLogin prohibit-password" >> /etc/ssh/sshd_config
fi

echo -e "${GREEN}✓${NC} SSH config updated"

# Step 6: Restart SSH daemon
echo -e "${YELLOW}[6/7]${NC} Restarting SSH daemon..."
if systemctl restart sshd 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH daemon restarted (systemctl)"
elif service ssh restart 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH daemon restarted (service)"
else
    echo -e "${RED}✗${NC} Failed to restart SSH daemon - please restart manually"
fi

# Step 7: Verification
echo -e "${YELLOW}[7/7]${NC} Verifying setup..."
echo ""
echo "=============================================="
echo "Verification Results"
echo "=============================================="

echo ""
echo "Directory Permissions:"
ls -ld /root/.ssh

echo ""
echo "Authorized Keys File:"
if [ -f /root/.ssh/authorized_keys ]; then
    ls -l /root/.ssh/authorized_keys
    echo ""
    echo "Number of keys: $(wc -l < /root/.ssh/authorized_keys)"
    echo ""
    echo "Key fingerprints:"
    ssh-keygen -lf /root/.ssh/authorized_keys 2>/dev/null || echo "No valid keys found"
else
    echo -e "${RED}✗${NC} authorized_keys not found!"
fi

echo ""
echo "SSH Daemon Config:"
echo "  PubkeyAuthentication: $(grep "^PubkeyAuthentication" /etc/ssh/sshd_config || echo "not set")"
echo "  PermitRootLogin: $(grep "^PermitRootLogin" /etc/ssh/sshd_config || echo "not set")"

echo ""
echo "=============================================="
echo -e "${GREEN}✓ Fix Complete!${NC}"
echo "=============================================="
echo "Completed at: $(date)"
echo ""
echo "Next steps:"
echo "1. Test SSH from your local machine:"
echo "   ssh -i C:\Users\luaho\.ssh\amp_vps_key root@103.54.153.248"
echo "2. Or use the alias:"
echo "   ssh vps"
echo ""
echo "If connection still fails, check:"
echo "- Key content in authorized_keys matches your public key"
echo "- Firewall allows port 22"
echo "- Run: tail -f /var/log/auth.log (to see live SSH attempts)"
echo ""
