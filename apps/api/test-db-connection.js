const { PrismaClient } = require('@prisma/client');

const testDbConnection = async () => {
  console.log('Testing database connection...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://test_user:test_password@localhost:5433/vedfinance_test'
      }
    }
  });

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test raw query
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log('✅ Database info:', result);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('✅ Tables in database:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

testDbConnection();
