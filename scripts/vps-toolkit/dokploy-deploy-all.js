/**
 * Deploy all v-edfinance services via Dokploy API
 * Usage: node dokploy-deploy-all.js
 */

const DOKPLOY_API_URL = process.env.DOKPLOY_API_URL || 'http://103.54.153.248:3000';
const DOKPLOY_API_TOKEN = process.env.DOKPLOY_API_TOKEN || process.argv[2];

if (!DOKPLOY_API_TOKEN) {
  console.error('❌ DOKPLOY_API_TOKEN not set in .env.production');
  process.exit(1);
}

async function dokployRequest(endpoint, method = 'GET', body = null) {
  const url = `${DOKPLOY_API_URL}/api${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${DOKPLOY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  return response.json();
}

async function getProjects() {
  return dokployRequest('/project.all');
}

async function getApplications(projectId) {
  return dokployRequest(`/application.all?projectId=${projectId}`);
}

async function deployApplication(applicationId) {
  return dokployRequest('/application.deploy', 'POST', { applicationId });
}

async function getDatabases(projectId) {
  return dokployRequest(`/postgres.all?projectId=${projectId}`);
}

async function deployDatabase(postgresId) {
  return dokployRequest('/postgres.deploy', 'POST', { postgresId });
}

async function main() {
  console.log('🚀 Dokploy Deployment Script\n');
  console.log(`API URL: ${DOKPLOY_API_URL}`);
  console.log(`Token: ${DOKPLOY_API_TOKEN.substring(0, 20)}...\n`);

  try {
    // Get all projects
    console.log('📋 Fetching projects...');
    const projects = await getProjects();
    console.log(`Found ${projects.length} projects\n`);

    // Find v-edfinance project
    const vedProject = projects.find(p => p.name.toLowerCase().includes('edfinance'));
    if (!vedProject) {
      console.error('❌ v-edfinance project not found');
      console.log('Available projects:', projects.map(p => p.name));
      process.exit(1);
    }

    console.log(`✅ Found project: ${vedProject.name} (ID: ${vedProject.projectId})\n`);

    // Get all services in the project
    console.log('📋 Fetching services...');
    
    // Get applications
    const apps = await getApplications(vedProject.projectId);
    console.log(`Found ${apps.length} applications`);

    // Get databases
    const databases = await getDatabases(vedProject.projectId);
    console.log(`Found ${databases.length} databases\n`);

    // Deploy order: postgres -> api -> web -> nginx
    const deployOrder = ['postgres', 'api', 'web', 'nginx'];

    // Deploy postgres first
    for (const db of databases) {
      console.log(`🗄️  Deploying database: ${db.name}...`);
      try {
        await deployDatabase(db.postgresId);
        console.log(`   ✅ ${db.name} deployment started`);
      } catch (err) {
        console.error(`   ❌ ${db.name} failed: ${err.message}`);
      }
    }

    // Wait for postgres to be ready
    console.log('\n⏳ Waiting 10s for postgres to start...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Deploy applications in order
    for (const appName of deployOrder.slice(1)) { // Skip postgres
      const app = apps.find(a => a.name.toLowerCase() === appName);
      if (!app) {
        console.log(`⚠️  Application '${appName}' not found, skipping`);
        continue;
      }

      console.log(`🚀 Deploying application: ${app.name}...`);
      try {
        await deployApplication(app.applicationId);
        console.log(`   ✅ ${app.name} deployment started`);
      } catch (err) {
        console.error(`   ❌ ${app.name} failed: ${err.message}`);
      }

      // Wait between deployments
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n✅ All deployments initiated!');
    console.log(`\n📊 Check status at: ${DOKPLOY_API_URL}/dashboard/projects`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
