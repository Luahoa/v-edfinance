/**
 * VPS SSH Connection Module
 * Uses ssh2 library for programmatic SSH access
 * Solves the problem: Coding agents can't use interactive SSH
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');
require('dotenv').config();

class VPSConnection {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.VPS_HOST || '103.54.153.248',
      port: config.port || process.env.VPS_PORT || 22,
      username: config.username || process.env.VPS_USER || 'root',
      privateKey: config.privateKey || this.loadPrivateKey(),
      readyTimeout: 120000,
      keepaliveInterval: 60000,
      keepaliveCountMax: 3,
    };
    
    this.client = new Client();
    this.isConnected = false;
  }

  /**
   * Load SSH private key from default location
   */
  loadPrivateKey() {
    // Use NEW key that works
    const keyPath = process.env.VPS_KEY_PATH || 
                    path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'vps_new_key');
    
    try {
      const keyContent = fs.readFileSync(keyPath, 'utf8');
      console.log(`Loading SSH key from: ${keyPath}`);
      console.log(`Key type: ${keyContent.includes('OPENSSH') ? 'OpenSSH' : 'PEM'}`);
      return keyContent;
    } catch (error) {
      throw new Error(`Failed to load SSH key from ${keyPath}: ${error.message}`);
    }
  }

  /**
   * Connect to VPS
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.client
        .on('ready', () => {
          this.isConnected = true;
          console.log('✓ SSH connection established');
          resolve();
        })
        .on('error', (err) => {
          this.isConnected = false;
          console.error('SSH Error Details:', err);
          reject(new Error(`SSH connection failed: ${err.message}`));
        })
        .on('close', () => {
          this.isConnected = false;
          console.log('SSH connection closed');
        })
        .on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
          console.log('Keyboard-interactive auth requested');
          finish([]);
        })
        .connect(this.config);
      
      console.log('Connecting with config:', {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        hasKey: !!this.config.privateKey,
        keyLength: this.config.privateKey ? this.config.privateKey.length : 0
      });
    });
  }

  /**
   * Execute a command on VPS
   * @param {string} command - Command to execute
   * @returns {Promise<{stdout: string, stderr: string, code: number}>}
   */
  exec(command) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('Not connected to VPS'));
      }

      this.client.exec(command, (err, stream) => {
        if (err) return reject(err);

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code, signal) => {
            resolve({ stdout, stderr, code, signal });
          })
          .on('data', (data) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data) => {
            stderr += data.toString();
          });
      });
    });
  }

  /**
   * Execute multiple commands sequentially
   * @param {string[]} commands - Array of commands
   * @returns {Promise<Array>}
   */
  async execMultiple(commands) {
    const results = [];
    
    for (const command of commands) {
      console.log(`Running: ${command}`);
      const result = await this.exec(command);
      results.push({ command, ...result });
      
      if (result.code !== 0) {
        console.warn(`⚠ Command failed with code ${result.code}: ${command}`);
        console.warn(`STDERR: ${result.stderr}`);
      }
    }
    
    return results;
  }

  /**
   * Upload file to VPS using SFTP
   * @param {string} localPath - Local file path
   * @param {string} remotePath - Remote file path
   * @returns {Promise<void>}
   */
  uploadFile(localPath, remotePath) {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) return reject(err);

        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) return reject(err);
          console.log(`✓ Uploaded: ${localPath} → ${remotePath}`);
          resolve();
        });
      });
    });
  }

  /**
   * Download file from VPS using SFTP
   * @param {string} remotePath - Remote file path
   * @param {string} localPath - Local file path
   * @returns {Promise<void>}
   */
  downloadFile(remotePath, localPath) {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) return reject(err);

        sftp.fastGet(remotePath, localPath, (err) => {
          if (err) return reject(err);
          console.log(`✓ Downloaded: ${remotePath} → ${localPath}`);
          resolve();
        });
      });
    });
  }

  /**
   * Check if Docker is installed
   * @returns {Promise<boolean>}
   */
  async checkDocker() {
    try {
      const result = await this.exec('docker --version');
      return result.code === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get VPS system information
   * @returns {Promise<Object>}
   */
  async getSystemInfo() {
    const commands = {
      hostname: 'hostname',
      os: 'lsb_release -d | cut -f2',
      kernel: 'uname -r',
      uptime: 'uptime -p',
      memory: "free -h | grep Mem | awk '{print $3 \"/\" $2}'",
      disk: "df -h / | tail -1 | awk '{print $3 \"/\" $2 \" (\" $5 \" used)\"}'",
      cpu: "nproc",
      docker: 'docker --version 2>&1 || echo "Not installed"',
    };

    const info = {};
    
    for (const [key, command] of Object.entries(commands)) {
      try {
        const result = await this.exec(command);
        info[key] = result.stdout.trim();
      } catch (error) {
        info[key] = 'Error: ' + error.message;
      }
    }

    return info;
  }

  /**
   * Disconnect from VPS
   */
  disconnect() {
    if (this.isConnected) {
      this.client.end();
      this.isConnected = false;
    }
  }
}

module.exports = VPSConnection;
