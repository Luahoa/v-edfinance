# VPS SSH Toolkit

**Programmatic SSH access to V-EdFinance VPS for coding agents**

## Problem Solved

Coding agents can't use interactive SSH commands like `ssh vps "command"` because they timeout or get cancelled. This toolkit provides a Node.js API using the `ssh2` library.

## Installation

```bash
cd scripts/vps-toolkit
npm install
cp .env.example .env
# Edit .env with your VPS credentials (or use defaults)
```

## Quick Start

### Test Connection

```bash
npm test
# or
node test-connection.js
```

**Output:**
```
✓ Connection successful
✓ System Information:
  Hostname: trumvps-1766224823246
  OS: Ubuntu 22.04.1 LTS
  Uptime: up 2 hours, 15 minutes
  Memory: 1.2G/4.0G
  Docker: Docker version 24.0.5
✅ All tests passed!
```

### Execute Commands

```bash
node exec-command.js "docker ps"
node exec-command.js "hostname && uptime"
node exec-command.js "ls -la /root/v-edfinance"
```

## Usage in Scripts

```javascript
const VPSConnection = require('./vps-connection');

async function deployApp() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    // Execute commands
    await vps.exec('cd /root/v-edfinance && git pull');
    await vps.exec('docker-compose up -d');
    
    // Upload files
    await vps.uploadFile('./dokploy.yaml', '/root/v-edfinance/dokploy.yaml');
    
    // Get system info
    const info = await vps.getSystemInfo();
    console.log('VPS Info:', info);
    
  } finally {
    vps.disconnect();
  }
}
```

## API Reference

### VPSConnection Class

#### Constructor
```javascript
const vps = new VPSConnection(config);
```

**Config options:**
- `host` - VPS IP (default: from .env or 103.54.153.248)
- `port` - SSH port (default: 22)
- `username` - SSH user (default: root)
- `privateKey` - SSH key (default: ~/.ssh/amp_vps_key)

#### Methods

**`connect()`** - Connect to VPS
```javascript
await vps.connect();
```

**`exec(command)`** - Execute single command
```javascript
const result = await vps.exec('docker ps');
// result = { stdout, stderr, code, signal }
```

**`execMultiple(commands)`** - Execute multiple commands
```javascript
const results = await vps.execMultiple([
  'apt-get update',
  'apt-get install -y docker.io',
  'docker --version'
]);
```

**`uploadFile(localPath, remotePath)`** - Upload file via SFTP
```javascript
await vps.uploadFile('./config.yml', '/root/config.yml');
```

**`downloadFile(remotePath, localPath)`** - Download file via SFTP
```javascript
await vps.downloadFile('/root/backup.sql', './backup.sql');
```

**`checkDocker()`** - Check if Docker is installed
```javascript
const hasDocker = await vps.checkDocker();
```

**`getSystemInfo()`** - Get VPS system information
```javascript
const info = await vps.getSystemInfo();
// info = { hostname, os, kernel, uptime, memory, disk, cpu, docker }
```

**`disconnect()`** - Close connection
```javascript
vps.disconnect();
```

## Environment Variables

Create `.env` file (copy from `.env.example`):

```env
VPS_HOST=103.54.153.248
VPS_PORT=22
VPS_USER=root
VPS_KEY_PATH=C:\Users\luaho\.ssh\amp_vps_key
```

## Examples

### 1. Deploy Monitoring Stack

```javascript
const VPSConnection = require('./vps-connection');

async function deployMonitoring() {
  const vps = new VPSConnection();
  await vps.connect();
  
  // Upload docker-compose file
  await vps.uploadFile(
    '../../docker-compose.monitoring.yml',
    '/root/v-edfinance/docker-compose.monitoring.yml'
  );
  
  // Deploy
  await vps.exec('cd /root/v-edfinance && docker-compose -f docker-compose.monitoring.yml up -d');
  
  // Verify
  const result = await vps.exec('docker ps | grep monitoring');
  console.log('Monitoring containers:', result.stdout);
  
  vps.disconnect();
}
```

### 2. Install Docker

```javascript
async function installDocker() {
  const vps = new VPSConnection();
  await vps.connect();
  
  const hasDocker = await vps.checkDocker();
  
  if (!hasDocker) {
    console.log('Installing Docker...');
    await vps.execMultiple([
      'apt-get update',
      'curl -fsSL https://get.docker.com | sh',
      'systemctl enable docker',
      'systemctl start docker',
      'docker --version'
    ]);
  }
  
  vps.disconnect();
}
```

### 3. Backup Database

```javascript
async function backupDatabase() {
  const vps = new VPSConnection();
  await vps.connect();
  
  // Create backup
  await vps.exec('docker exec postgres pg_dumpall -U postgres > /tmp/backup.sql');
  
  // Download backup
  await vps.downloadFile('/tmp/backup.sql', './backup.sql');
  
  console.log('✓ Database backed up to ./backup.sql');
  
  vps.disconnect();
}
```

## Troubleshooting

### "Failed to load SSH key"

Make sure key path in `.env` is correct:
```
VPS_KEY_PATH=C:\Users\luaho\.ssh\amp_vps_key
```

### "SSH connection failed: All configured authentication methods failed"

Check:
1. SSH key permissions fixed on VPS:
   ```bash
   chmod 700 /root/.ssh
   chmod 600 /root/.ssh/authorized_keys
   ```
2. Public key is in `/root/.ssh/authorized_keys`

### "Connection timeout"

Check VPS firewall allows port 22:
```bash
ufw allow 22/tcp
```

## Benefits for Coding Agents

1. **Non-interactive** - No terminal prompts, pure programmatic
2. **Error handling** - Catch and handle SSH errors
3. **Async/await** - Modern JavaScript syntax
4. **SFTP support** - Upload/download files easily
5. **Reusable** - Single connection for multiple commands

## Next Steps

1. ✅ Test connection: `npm test`
2. ✅ Execute commands: `node exec-command.js "command"`
3. 🔄 Create deployment scripts using this toolkit
4. 🔄 Integrate with Beads workflow automation

---

**Library:** [mscdex/ssh2](https://github.com/mscdex/ssh2) (5,738 ⭐)  
**Created:** 2026-01-05  
**Purpose:** Enable coding agents to access VPS programmatically
