/**
 * Deploy API manually on VPS (without Docker)
 * Alternative strategy: Run Node.js directly
 */

const VPSConnection = require('./vps-connection');

async function deployAPIManual() {
  console.log('==============================================');
  console.log('Manual API Deployment (No Docker Build)');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
    await vps.connect();

    // Step 1: Upload code if not present
    console.log('[1/8] Checking project directory...');
    const dirCheck = await vps.exec('test -d /root/v-edfinance-api && echo "EXISTS" || echo "NOT_FOUND"');
    
    if (dirCheck.stdout.includes('NOT_FOUND')) {
      console.log('Creating project directory...');
      await vps.exec('mkdir -p /root/v-edfinance-api');
    }
    console.log('✓ Directory ready\n');

    // Step 2: Install Node.js if not present
    console.log('[2/8] Checking Node.js installation...');
    const nodeCheck = await vps.exec('node --version || echo "NOT_INSTALLED"');
    
    if (nodeCheck.stdout.includes('NOT_INSTALLED')) {
      console.log('Installing Node.js 20...');
      await vps.exec('curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
      await vps.exec('apt-get install -y nodejs');
    }
    
    const nodeVersion = await vps.exec('node --version');
    console.log(`✓ Node.js: ${nodeVersion.stdout.trim()}\n`);

    // Step 3: Install pnpm
    console.log('[3/8] Installing pnpm...');
    await vps.exec('npm install -g pnpm || echo "Already installed"');
    const pnpmVersion = await vps.exec('pnpm --version');
    console.log(`✓ pnpm: ${pnpmVersion.stdout.trim()}\n`);

    // Step 4: Upload API code (simplified - just create structure)
    console.log('[4/8] Setting up API structure...');
    await vps.exec('mkdir -p /root/v-edfinance-api/apps/api/dist');
    console.log('⚠️  Note: Code needs to be uploaded separately via rsync/scp\n');

    // Step 5: Create package.json
    console.log('[5/8] Creating package.json...');
    const packageJson = {
      name: "v-edfinance-api",
      version: "1.0.0",
      scripts: {
        start: "node apps/api/dist/main.js"
      },
      dependencies: {
        "@nestjs/core": "^10.0.0",
        "@nestjs/common": "^10.0.0",
        "@nestjs/platform-express": "^10.0.0",
        "prisma": "^5.0.0",
        "@prisma/client": "^5.0.0"
      }
    };
    
    await vps.exec(`echo '${JSON.stringify(packageJson, null, 2)}' > /root/v-edfinance-api/package.json`);
    console.log('✓ package.json created\n');

    // Step 6: Create .env file
    console.log('[6/8] Creating .env file...');
    const envContent = `
DATABASE_URL="postgresql://postgres:vedfinance2024@localhost:5432/vedfinance"
PORT=3000
NODE_ENV=production
`;
    await vps.exec(`echo '${envContent.trim()}' > /root/v-edfinance-api/.env`);
    console.log('✓ .env created\n');

    // Step 7: Create systemd service
    console.log('[7/8] Creating systemd service...');
    const serviceContent = `
[Unit]
Description=V-EdFinance API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/v-edfinance-api
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`;
    
    await vps.exec(`echo '${serviceContent.trim()}' > /etc/systemd/system/vedfinance-api.service`);
    await vps.exec('systemctl daemon-reload');
    console.log('✓ Service created\n');

    // Step 8: Display next steps
    console.log('[8/8] Manual deployment setup complete!\n');
    
    console.log('==============================================');
    console.log('⚠️  NEXT STEPS (Manual):');
    console.log('==============================================');
    console.log('1. Build API locally:');
    console.log('   pnpm --filter api build');
    console.log('');
    console.log('2. Upload built code to VPS:');
    console.log('   scp -r apps/api/dist root@103.54.153.248:/root/v-edfinance-api/apps/api/');
    console.log('   scp -r node_modules root@103.54.153.248:/root/v-edfinance-api/');
    console.log('   scp -r prisma root@103.54.153.248:/root/v-edfinance-api/');
    console.log('');
    console.log('3. Start service on VPS:');
    console.log('   ssh root@103.54.153.248 "systemctl start vedfinance-api"');
    console.log('   ssh root@103.54.153.248 "systemctl status vedfinance-api"');
    console.log('');
    console.log('4. Verify:');
    console.log('   curl http://103.54.153.248:3000/api/health');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

deployAPIManual();
