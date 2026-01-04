/**
 * VPS Deployment WITHOUT Firewall Configuration
 * Use this version to avoid firewall lockout issues
 */

const VPSConnection = require('./vps-connection');
const fs = require('fs');
const path = require('path');

class NoFirewallDeployer {
  constructor() {
    this.vps = new VPSConnection();
  }

  log(msg, type = 'info') {
    const emoji = { info: 'ℹ️', success: '✅', error: '❌', progress: '🔄' }[type];
    console.log(`${emoji} ${msg}`);
  }

  async deploy() {
    try {
      await this.vps.connect();
      this.log('Connected to VPS', 'success');

      // Track 1: Infrastructure (NO FIREWALL)
      this.log('Track 1: Infrastructure setup...', 'progress');
      await this.installDocker();
      await this.createDeployerUser();
      await this.installRclone();

      // Track 2: Database
      this.log('Track 2: PostgreSQL deployment...', 'progress');
      await this.deployPostgreSQL();

      // Track 3: Monitoring
      this.log('Track 3: Monitoring stack...', 'progress');
      await this.deployMonitoring();

      // Track 5: Backup
      this.log('Track 5: Backup cron...', 'progress');
      await this.setupBackupCron();

      this.log('='.repeat(60), 'info');
      this.log('DEPLOYMENT COMPLETE (NO FIREWALL)', 'success');
      this.log('='.repeat(60), 'info');
      this.log('Note: Firewall NOT configured. Configure manually if needed.', 'info');

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      throw error;
    } finally {
      this.vps.disconnect();
    }
  }

  async installDocker() {
    const hasDocker = await this.vps.checkDocker();
    if (hasDocker) {
      this.log('Docker already installed', 'info');
      return;
    }

    await this.vps.exec('curl -fsSL https://get.docker.com | sh');
    await this.vps.exec('systemctl enable docker');
    await this.vps.exec('systemctl start docker');
    this.log('Docker installed', 'success');
  }

  async createDeployerUser() {
    const commands = [
      'useradd -m -s /bin/bash deployer || true',
      'usermod -aG docker deployer',
      'mkdir -p /home/deployer/.ssh',
      'cp /root/.ssh/authorized_keys /home/deployer/.ssh/ || true',
      'chown -R deployer:deployer /home/deployer/.ssh',
      'chmod 700 /home/deployer/.ssh',
      'chmod 600 /home/deployer/.ssh/authorized_keys'
    ];

    for (const cmd of commands) {
      await this.vps.exec(cmd);
    }
    this.log('Deployer user created', 'success');
  }

  async installRclone() {
    await this.vps.exec('curl https://rclone.org/install.sh | bash');
    this.log('Rclone installed', 'success');
  }

  async deployPostgreSQL() {
    await this.vps.exec('mkdir -p /root/v-edfinance');
    
    await this.vps.uploadFile(
      path.join(__dirname, '../../init-db.sql'),
      '/root/v-edfinance/init-db.sql'
    );
    
    await this.vps.uploadFile(
      path.join(__dirname, '../../dokploy.yaml'),
      '/root/v-edfinance/dokploy.yaml'
    );
    
    this.log('PostgreSQL config uploaded', 'success');
  }

  async deployMonitoring() {
    await this.vps.uploadFile(
      path.join(__dirname, '../../docker-compose.monitoring.yml'),
      '/root/v-edfinance/docker-compose.monitoring.yml'
    );

    await this.vps.exec('mkdir -p /root/v-edfinance/monitoring/{prometheus,grafana}');
    
    await this.vps.exec(
      'cd /root/v-edfinance && docker-compose -f docker-compose.monitoring.yml up -d'
    );
    
    this.log('Monitoring deployed', 'success');
  }

  async setupBackupCron() {
    await this.vps.exec('mkdir -p /root/v-edfinance/scripts');
    
    await this.vps.uploadFile(
      path.join(__dirname, '../backup-to-r2.sh'),
      '/root/v-edfinance/scripts/backup-to-r2.sh'
    );
    
    await this.vps.exec('chmod +x /root/v-edfinance/scripts/backup-to-r2.sh');
    
    const cron = '0 3 * * * /root/v-edfinance/scripts/backup-to-r2.sh >> /var/log/backup.log 2>&1';
    await this.vps.exec(`(crontab -l 2>/dev/null | grep -v backup-to-r2; echo "${cron}") | crontab -`);
    
    this.log('Backup cron configured', 'success');
  }
}

if (require.main === module) {
  const deployer = new NoFirewallDeployer();
  deployer.deploy().catch(console.error);
}

module.exports = NoFirewallDeployer;
