/**
 * List all existing tables
 */

const VPSConnection = require('./vps-connection');

async function listTables() {
  const vps = new VPSConnection();

  try {
    await vps.connect();

    const cmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`;
    const result = await vps.exec(cmd);
    console.log(result.stdout);

  } catch (error) {
    console.error('Failed:', error.message);
  } finally {
    vps.disconnect();
  }
}

listTables();
