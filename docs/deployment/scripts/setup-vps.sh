#!/bin/bash

#############################################
# V-EdFinance VPS Auto Setup Script
# OS: Ubuntu 22.04 LTS
# Purpose: Automated Dokploy + Security Hardening
# Usage: curl -sSL <raw-url> | bash
#############################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Progress bar
show_progress() {
    local current=$1
    local total=$2
    local step=$3
    echo -e "${BLUE}[${current}/${total}]${NC} ${step}"
}

#############################################
# Step 1: System Information
#############################################
show_progress 1 10 "Collecting system information..."

log_info "OS: $(lsb_release -d | cut -f2)"
log_info "Kernel: $(uname -r)"
log_info "RAM: $(free -h | awk '/^Mem:/ {print $2}')"
log_info "CPU: $(nproc) cores"
log_info "Disk: $(df -h / | awk 'NR==2 {print $2}')"

#############################################
# Step 2: Update System
#############################################
show_progress 2 10 "Updating system packages..."

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get autoremove -y -qq
apt-get autoclean -y -qq

log_success "System updated successfully"

#############################################
# Step 3: Install Essential Tools
#############################################
show_progress 3 10 "Installing essential tools..."

apt-get install -y -qq \
    curl \
    wget \
    git \
    htop \
    vim \
    ufw \
    fail2ban \
    unattended-upgrades \
    apt-transport-https \
    ca-certificates \
    software-properties-common \
    gnupg \
    lsb-release

log_success "Essential tools installed"

#############################################
# Step 4: Configure Firewall (UFW)
#############################################
show_progress 4 10 "Configuring firewall..."

# Reset UFW to default
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (port 22)
ufw allow 22/tcp comment 'SSH'

# Allow HTTP (port 80)
ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS (port 443)
ufw allow 443/tcp comment 'HTTPS'

# Allow Dokploy Dashboard (port 3000)
ufw allow 3000/tcp comment 'Dokploy Dashboard'

# Enable UFW
ufw --force enable

log_success "Firewall configured and enabled"
ufw status numbered

#############################################
# Step 5: Configure Fail2Ban
#############################################
show_progress 5 10 "Configuring Fail2Ban..."

# Create local jail configuration
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = root@localhost
sendername = Fail2Ban

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF

# Restart Fail2Ban
systemctl enable fail2ban
systemctl restart fail2ban

log_success "Fail2Ban configured"

#############################################
# Step 6: Enable Automatic Security Updates
#############################################
show_progress 6 10 "Enabling automatic security updates..."

cat > /etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

log_success "Automatic security updates enabled"

#############################################
# Step 7: Optimize System (sysctl)
#############################################
show_progress 7 10 "Applying system optimizations..."

cat >> /etc/sysctl.conf <<EOF

# V-EdFinance Performance Tuning
# Network optimizations
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# File system optimizations
fs.file-max = 65535
fs.inotify.max_user_watches = 524288

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sysctl -p > /dev/null 2>&1

log_success "System optimizations applied"

#############################################
# Step 8: Install Docker (if not present)
#############################################
show_progress 8 10 "Checking Docker installation..."

if ! command -v docker &> /dev/null; then
    log_info "Docker not found, installing..."
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl enable docker
    systemctl start docker
    
    log_success "Docker installed successfully"
else
    log_success "Docker already installed: $(docker --version)"
fi

#############################################
# Step 9: Install Dokploy
#############################################
show_progress 9 10 "Installing Dokploy..."

log_warning "This may take 3-5 minutes..."

# Run Dokploy installation
curl -sSL https://dokploy.com/install.sh | sh

log_success "Dokploy installation completed"

#############################################
# Step 10: Final Configuration
#############################################
show_progress 10 10 "Running final configuration..."

# Create swap file if not exists (for VPS with limited RAM)
if [ ! -f /swapfile ]; then
    log_info "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    log_success "Swap file created"
else
    log_info "Swap file already exists"
fi

# Set timezone to Asia/Bangkok (Vietnam timezone)
timedatectl set-timezone Asia/Ho_Chi_Minh
log_success "Timezone set to Asia/Ho_Chi_Minh"

# Clean up
apt-get autoremove -y -qq
apt-get autoclean -y -qq

#############################################
# Installation Complete
#############################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "🎉 V-EdFinance VPS Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unable to detect")

echo -e "${GREEN}✅ Installation Summary:${NC}"
echo "   • OS: Ubuntu 22.04 LTS"
echo "   • Docker: Installed"
echo "   • Dokploy: Installed"
echo "   • Firewall: Configured (UFW)"
echo "   • Security: Fail2Ban enabled"
echo "   • Auto-updates: Enabled"
echo "   • Swap: 2GB configured"
echo ""

echo -e "${BLUE}🌐 Access Information:${NC}"
echo "   • Server IP: ${SERVER_IP}"
echo "   • Dokploy Dashboard: http://${SERVER_IP}:3000"
echo "   • SSH: ssh root@${SERVER_IP}"
echo ""

echo -e "${YELLOW}⚡ Next Steps:${NC}"
echo "   1. Access Dokploy dashboard: http://${SERVER_IP}:3000"
echo "   2. Create admin account"
echo "   3. Configure DNS for your domain"
echo "   4. Deploy V-EdFinance application"
echo ""

echo -e "${YELLOW}📋 Important Notes:${NC}"
echo "   • Save your Dokploy admin password securely"
echo "   • Configure DNS A records to point to: ${SERVER_IP}"
echo "   • SSL certificates will be auto-generated by Dokploy"
echo "   • Monitor logs: docker logs -f dokploy"
echo ""

echo -e "${GREEN}🔒 Security Status:${NC}"
ufw status numbered | head -10
echo ""

log_success "Setup completed successfully!"
log_info "Dokploy may take 2-3 minutes to fully start. Please wait..."
echo ""
