/**
 * AI Database Optimizer - Autonomous Query Optimization Script
 * VED-DRX: Deploy AI Agent to VPS staging
 *
 * This script:
 * 1. Analyzes pg_stat_statements for slow queries
 * 2. Generates optimization recommendations using Gemini AI
 * 3. Stores results in OptimizationLog with vector embeddings
 * 4. Runs weekly via cron job
 *
 * Usage:
 *   pnpm tsx apps/api/src/modules/ai/scripts/optimize-database.ts
 *   # OR (after build)
 *   node dist/modules/ai/scripts/optimize-database.js
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { AiService } from '../../../ai/ai.service';
import { KyselyService } from '../../../database/kysely.service';
import { PgvectorService } from '../../../database/pgvector.service';
import { Logger } from '@nestjs/common';
import { sql } from 'kysely';

const logger = new Logger('AI-DB-Optimizer');

interface SlowQuery {
  query: string;
  calls: number;
  mean_exec_time: number;
  total_exec_time: number;
  rows: number;
}

async function main() {
  logger.log('🤖 AI Database Architect - Starting Optimization Scan...');
  logger.log('═══════════════════════════════════════════════════════════');

  // Initialize NestJS app
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const aiService = app.get(AiService);
    const kyselyService = app.get(KyselyService);
    const pgvectorService = app.get(PgvectorService);

    // Step 1: Fetch slow queries from pg_stat_statements
    logger.log('\n📊 Step 1: Analyzing pg_stat_statements...');

    const slowQueries = await kyselyService.query
      .selectFrom(sql`pg_stat_statements`.as('pg_stat_statements'))
      .select([
        sql<string>`query`.as('query'),
        sql<number>`calls`.as('calls'),
        sql<number>`mean_exec_time`.as('mean_exec_time'),
        sql<number>`total_exec_time`.as('total_exec_time'),
        sql<number>`rows`.as('rows'),
      ])
      .where(sql`mean_exec_time`, '>', sql`50`) // Queries slower than 50ms
      .orderBy(sql`total_exec_time`, 'desc')
      .limit(20)
      .execute();

    if (slowQueries.length === 0) {
      logger.log('✅ No slow queries found! Database is well-optimized.');
      await app.close();
      return;
    }

    logger.log(`   Found ${slowQueries.length} slow queries to analyze`);
    logger.log(
      `   Slowest query: ${slowQueries[0].mean_exec_time.toFixed(2)}ms avg`,
    );

    // Step 2: Generate optimization recommendations using AI
    logger.log('\n🧠 Step 2: Generating AI recommendations...');

    const optimizations: Array<{
      query: string;
      recommendation: string;
      confidence: number;
      performanceGain: number;
    }> = [];

    for (const slowQuery of slowQueries.slice(0, 10)) {
      // Top 10 only
      try {
        logger.log(`   Analyzing: ${slowQuery.query.substring(0, 60)}...`);

        // Generate optimization prompt
        const prompt = `Analyze this PostgreSQL query and suggest optimizations:

Query:
\`\`\`sql
${slowQuery.query}
\`\`\`

Performance Stats:
- Average execution time: ${slowQuery.mean_exec_time.toFixed(2)}ms
- Total calls: ${slowQuery.calls}
- Rows returned: ${slowQuery.rows}

Provide:
1. Specific optimization recommendations (indexes, query rewrite, etc.)
2. Estimated performance gain (%)
3. Confidence level (0-100)

Format your response as JSON:
{
  "recommendation": "...",
  "performanceGain": <number>,
  "confidence": <number>
}`;

        const result = await aiService.modelInstance.generateContent(prompt);
        const response = result.response.text();

        // Parse AI response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiResult = JSON.parse(jsonMatch[0]);

          optimizations.push({
            query: slowQuery.query,
            recommendation: aiResult.recommendation,
            confidence: aiResult.confidence,
            performanceGain: aiResult.performanceGain,
          });

          logger.log(
            `   ✅ Recommendation generated (confidence: ${aiResult.confidence}%)`,
          );
        } else {
          logger.warn(`   ⚠️  Failed to parse AI response`);
        }

        // Rate limiting: wait 2s between AI calls
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`   ❌ Failed to analyze query: ${error.message}`);
      }
    }

    logger.log(
      `\n   Generated ${optimizations.length} optimization recommendations`,
    );

    // Step 3: Store recommendations in OptimizationLog with embeddings
    logger.log('\n💾 Step 3: Storing recommendations in database...');

    let storedCount = 0;
    for (const opt of optimizations) {
      try {
        // Check if similar optimization already exists (deduplication)
        const similarOpts = await pgvectorService.findSimilarOptimizations(
          opt.query,
          { threshold: 0.95, limit: 1 },
        );

        if (similarOpts.length > 0) {
          logger.log(`   ⏭️  Skipped duplicate optimization for similar query`);
          continue;
        }

        // Store new optimization
        const logId = await pgvectorService.storeOptimization({
          queryText: opt.query,
          recommendation: opt.recommendation,
          performanceGain: opt.performanceGain,
          metadata: {
            confidence: opt.confidence,
            scanDate: new Date().toISOString(),
            source: 'ai-database-architect',
          },
        });

        storedCount++;
        logger.log(`   ✅ Stored optimization: ${logId.substring(0, 8)}...`);
      } catch (error) {
        logger.error(`   ❌ Failed to store optimization: ${error.message}`);
      }
    }

    // Step 4: Summary report
    logger.log('\n📊 Optimization Scan Complete!');
    logger.log('═══════════════════════════════════════════════════════════');
    logger.log(`   Slow queries analyzed: ${slowQueries.length}`);
    logger.log(`   Recommendations generated: ${optimizations.length}`);
    logger.log(`   New recommendations stored: ${storedCount}`);
    logger.log(`   Duplicates skipped: ${optimizations.length - storedCount}`);

    if (storedCount > 0) {
      logger.log('\n💡 Next Steps:');
      logger.log('   1. Review recommendations in OptimizationLog table');
      logger.log('   2. Apply high-confidence (>80%) optimizations');
      logger.log('   3. Measure performance gains');
      logger.log('   4. Update appliedAt timestamp after implementation');
    }

    logger.log('\n✅ AI Database Architect - Scan completed successfully!');
  } catch (error) {
    logger.error('❌ Fatal error during optimization scan:');
    logger.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as runDatabaseOptimization };
