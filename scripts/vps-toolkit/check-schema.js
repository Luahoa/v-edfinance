/**
 * Check actual database schema
 */

const VPSConnection = require('./vps-connection');

async function checkDatabaseSchema() {
  const vps = new VPSConnection();

  try {
    await vps.connect();

    console.log('Checking BehaviorLog table columns...\n');
    const checkCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "\\d+ \\"BehaviorLog\\";"`;
    const result = await vps.exec(checkCmd);
    console.log(result.stdout);

  } catch (error) {
    console.error('Failed:', error.message);
  } finally {
    vps.disconnect();
  }
}

checkDatabaseSchema();
