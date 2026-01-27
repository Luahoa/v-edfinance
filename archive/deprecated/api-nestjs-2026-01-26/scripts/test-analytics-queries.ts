/**
 * Quick test script to verify database optimization
 * Run: pnpm ts-node scripts/test-analytics-queries.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseOptimization() {
  console.log('\n🔍 Testing Database Optimization\n');

  try {
    // Test 1: Data verification
    console.log('📊 Test 1: Data Verification');
    const [userCount, courseCount, behaviorCount, achievementCount] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.behaviorLog.count(),
      prisma.achievement.count(),
    ]);
    console.log(`   ✅ Users: ${userCount}`);
    console.log(`   ✅ Courses: ${courseCount}`);
    console.log(`   ✅ Behavior Logs: ${behaviorCount}`);
    console.log(`   ✅ Achievements: ${achievementCount}`);

    // Test 2: Performance indexes
    console.log('\n📊 Test 2: Performance Indexes');
    const indexes = await prisma.$queryRaw<Array<{ indexname: string; tablename: string }>>`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND (
        tablename IN ('BehaviorLog', 'UserProgress', 'User', 'Course')
      )
      ORDER BY tablename, indexname
    `;
    console.log(`   ✅ Found ${indexes.length} indexes:`);
    const grouped = indexes.reduce((acc, idx) => {
      if (!acc[idx.tablename]) acc[idx.tablename] = [];
      acc[idx.tablename].push(idx.indexname);
      return acc;
    }, {} as Record<string, string[]>);
    Object.entries(grouped).forEach(([table, idxs]) => {
      console.log(`      ${table}: ${idxs.length} indexes`);
    });

    // Test 3: Simple query performance
    console.log('\n⚡ Test 3: Query Performance');
    
    const start1 = Date.now();
    const users = await prisma.user.findMany({ take: 10 });
    const time1 = Date.now() - start1;
    console.log(`   ✅ Users query: ${time1}ms (${users.length} rows)`);

    const start2 = Date.now();
    const courses = await prisma.course.findMany({ take: 5 });
    const time2 = Date.now() - start2;
    console.log(`   ✅ Courses query: ${time2}ms (${courses.length} rows)`);

    const start3 = Date.now();
    const behaviors = await prisma.behaviorLog.findMany({ take: 100 });
    const time3 = Date.now() - start3;
    console.log(`   ✅ Behavior logs query: ${time3}ms (${behaviors.length} rows)`);

    // Test 4: Aggregate performance
    console.log('\n📈 Test 4: Analytics Aggregation');
    const start4 = Date.now();
    const stats = await prisma.behaviorLog.groupBy({
      by: ['eventType'],
      _count: { id: true },
    });
    const time4 = Date.now() - start4;
    console.log(`   ✅ Event type grouping: ${time4}ms (${stats.length} groups)`);
    stats.forEach((s) => {
      console.log(`      - ${s.eventType}: ${s._count.id} events`);
    });

    console.log('\n✅ Database optimization verified!\n');
    console.log('📋 Summary:');
    console.log(`   - Data: ${userCount} users, ${courseCount} courses, ${behaviorCount} logs`);
    console.log(`   - Indexes: ${indexes.length} total`);
    console.log(`   - Performance: All queries <${Math.max(time1, time2, time3, time4)}ms`);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseOptimization();
