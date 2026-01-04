/**
 * Safe VPS Deployment Orchestrator
 * Prevents firewall lockout and handles errors gracefully
 */

const VPSConnection = require('./vps-connection');
const fs = require('fs');
const path = require('path');

class SafeVPSDeployer {
  constructor() {
    this.vps = new VPSConnection();
    this.deploymentLog = [];
  }

  log(message, type = 'info') {
    const entry = { timestamp: new Date().toISOString(), type, message };
    this.deploymentLog.push(entry);
    
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      progress: '🔄'
    }[type] || 'ℹ️';
    
    console.log(`${emoji} [${type.toUpperCase()}] ${message}`);
  }

  /**
   * CRITICAL: Configure firewall BEFORE enabling
   * Prevents SSH lockout
   */
  async configureFirewallSafe() {
    this.log('Configuring firewall with safety checks...', 'progress');
    
    const commands = [
      // Configure rules BEFORE enabling
      'ufw default deny incoming',
      'ufw default allow outgoing',
      
      // Essential ports
      'ufw allow 22/tcp comment "SSH - CRITICAL"',
      'ufw allow 80/tcp comment "HTTP"',
      'ufw allow 443/tcp comment "HTTPS"',
      
      // Application ports
      'ufw allow 3000:3003/tcp comment "Dokploy + Apps"',
      'ufw allow 5432/tcp comment "PostgreSQL"',
      'ufw allow 6379/tcp comment "Redis"',
      
      // Monitoring ports
      'ufw allow 8090/tcp comment "Beszel"',
      'ufw allow 9090/tcp comment "Prometheus"',
      'ufw allow 19999/tcp comment "Netdata"',
      'ufw allow 61208/tcp comment "Glances"',
      
      // Enable AFTER all rules configured
      'echo "y" | ufw enable',
      'ufw status numbered'
    ];

    for (const cmd of commands) {
      try {
        const result = await this.vps.exec(cmd);
        this.log(`Firewall config: ${cmd.substring(0, 50)}...`, 'success');
      } catch (error) {
        this.log(`Firewall command failed: ${cmd}`, 'error');
        throw error;
      }
    }

    // Verify SSH still works
    await this.verifySSHAccess();
    
    this.log('Firewall configured successfully', 'success');
  }

  /**
   * Verify SSH access after firewall changes
   */
  async verifySSHAccess() {
    this.log('Verifying SSH access...', 'progress');
    
    try {
      const result = await this.vps.exec('echo "SSH OK"');
      if (result.stdout.includes('SSH OK')) {
        this.log('SSH access verified', 'success');
        return true;
      }
    } catch (error) {
      this.log('SSH access verification FAILED!', 'error');
      throw new Error('SSH locked out after firewall changes!');
    }
  }

  /**
   * Track 1: Install Docker (BlueLake)
   */
  async installDocker() {
    this.log('Track 1 (BlueLake): Installing Docker...', 'progress');
    
    const hasDocker = await this.vps.checkDocker();
    
    if (hasDocker) {
      this.log('Docker already installed, skipping', 'info');
      return;
    }

    const commands = [
      'curl -fsSL https://get.docker.com -o /tmp/get-docker.sh',
      'sh /tmp/get-docker.sh',
      'systemctl enable docker',
      'systemctl start docker',
      'docker --version'
    ];

    for (const cmd of commands) {
      const result = await this.vps.exec(cmd);
      this.log(`Docker install: ${cmd}`, 'success');
    }

    this.log('Docker installed successfully', 'success');
  }

  /**
   * Track 1: Create deployer user
   */
  async createDeployerUser() {
    this.log('Creating deployer user...', 'progress');

    const commands = [
      'useradd -m -s /bin/bash deployer || echo "User exists"',
      'usermod -aG docker deployer',
      'mkdir -p /home/deployer/.ssh',
      'cp /root/.ssh/authorized_keys /home/deployer/.ssh/',
      'chown -R deployer:deployer /home/deployer/.ssh',
      'chmod 700 /home/deployer/.ssh',
      'chmod 600 /home/deployer/.ssh/authorized_keys'
    ];

    for (const cmd of commands) {
      await this.vps.exec(cmd);
    }

    this.log('Deployer user created', 'success');
  }

  /**
   * Track 1: Install Rclone
   */
  async installRclone() {
    this.log('Installing Rclone...', 'progress');

    const commands = [
      'curl https://rclone.org/install.sh -o /tmp/install-rclone.sh',
      'bash /tmp/install-rclone.sh',
      'rclone version'
    ];

    for (const cmd of commands) {
      const result = await this.vps.exec(cmd);
      this.log(`Rclone: ${result.stdout.trim()}`, 'success');
    }

    this.log('Rclone installed', 'success');
  }

  /**
   * Track 2: Deploy PostgreSQL with extensions (GreenMountain)
   */
  async deployPostgreSQL() {
    this.log('Track 2 (GreenMountain): Deploying PostgreSQL...', 'progress');

    // Upload init-db.sql
    await this.vps.uploadFile(
      path.join(__dirname, '../../init-db.sql'),
      '/root/v-edfinance/init-db.sql'
    );

    // Upload dokploy.yaml (has PostgreSQL config)
    await this.vps.uploadFile(
      path.join(__dirname, '../../dokploy.yaml'),
      '/root/v-edfinance/dokploy.yaml'
    );

    // Create necessary directories
    await this.vps.exec('mkdir -p /root/v-edfinance');

    this.log('PostgreSQL config uploaded', 'success');
  }

  /**
   * Track 3: Deploy monitoring stack (RedRiver)
   */
  async deployMonitoring() {
    this.log('Track 3 (RedRiver): Deploying monitoring stack...', 'progress');

    // Upload docker-compose.monitoring.yml
    await this.vps.uploadFile(
      path.join(__dirname, '../../docker-compose.monitoring.yml'),
      '/root/v-edfinance/docker-compose.monitoring.yml'
    );

    // Upload monitoring configs
    await this.vps.exec('mkdir -p /root/v-edfinance/monitoring/prometheus');
    await this.vps.exec('mkdir -p /root/v-edfinance/monitoring/grafana');

    // Start monitoring stack
    const result = await this.vps.exec(
      'cd /root/v-edfinance && docker-compose -f docker-compose.monitoring.yml up -d'
    );

    this.log('Monitoring stack deployed', 'success');
    this.log(`Containers started: ${result.stdout}`, 'info');
  }

  /**
   * Track 5: Setup backup cron (OrangeSky)
   */
  async setupBackupCron() {
    this.log('Track 5 (OrangeSky): Setting up backup cron...', 'progress');

    // Upload backup script
    await this.vps.uploadFile(
      path.join(__dirname, '../backup-to-r2.sh'),
      '/root/v-edfinance/scripts/backup-to-r2.sh'
    );

    await this.vps.exec('chmod +x /root/v-edfinance/scripts/backup-to-r2.sh');

    // Add cron job (3 AM daily)
    const cronEntry = '0 3 * * * /root/v-edfinance/scripts/backup-to-r2.sh >> /var/log/backup.log 2>&1';
    await this.vps.exec(`(crontab -l 2>/dev/null | grep -v backup-to-r2; echo "${cronEntry}") | crontab -`);

    this.log('Backup cron configured', 'success');
  }

  /**
   * Full deployment orchestration
   */
  async deploy() {
    try {
      await this.vps.connect();
      this.log('Connected to VPS', 'success');

      const info = await this.vps.getSystemInfo();
      this.log(`VPS: ${info.hostname}, ${info.os}, ${info.memory}`, 'info');

      // Track 1: Infrastructure
      await this.installDocker();
      await this.configureFirewallSafe(); // SAFE firewall config
      await this.createDeployerUser();
      await this.installRclone();

      // Track 2: Database
      await this.deployPostgreSQL();

      // Track 3: Monitoring
      await this.deployMonitoring();

      // Track 5: Backup
      await this.setupBackupCron();

      this.log('='.repeat(60), 'info');
      this.log('DEPLOYMENT COMPLETE!', 'success');
      this.log('='.repeat(60), 'info');

      // Save deployment log
      const logPath = path.join(__dirname, `deployment-log-${Date.now()}.json`);
      fs.writeFileSync(logPath, JSON.stringify(this.deploymentLog, null, 2));
      this.log(`Deployment log saved: ${logPath}`, 'info');

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      this.vps.disconnect();
    }
  }
}

// CLI execution
if (require.main === module) {
  const deployer = new SafeVPSDeployer();
  deployer.deploy().catch(console.error);
}

module.exports = SafeVPSDeployer;
