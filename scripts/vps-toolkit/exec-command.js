/**
 * Execute command on VPS
 * Usage: node exec-command.js "your command here"
 */

const VPSConnection = require('./vps-connection');

async function execCommand() {
  const command = process.argv.slice(2).join(' ');
  
  if (!command) {
    console.error('Usage: node exec-command.js "command to execute"');
    console.error('Example: node exec-command.js "docker ps"');
    process.exit(1);
  }

  const vps = new VPSConnection();

  try {
    await vps.connect();
    
    console.log(`Executing: ${command}\n`);
    const result = await vps.exec(command);
    
    if (result.stdout) {
      console.log('STDOUT:');
      console.log(result.stdout);
    }
    
    if (result.stderr) {
      console.error('STDERR:');
      console.error(result.stderr);
    }
    
    console.log(`\nExit code: ${result.code}`);
    
    process.exit(result.code);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

execCommand();
