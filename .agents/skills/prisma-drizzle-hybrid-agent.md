# Prisma-Drizzle Hybrid Agent

## Mục Đích
AI agent chuyên về Triple-ORM coordination (Prisma + Drizzle + Kysely), đảm bảo schema sync, type safety, và optimal ORM selection cho từng use case.

## Triple-ORM Strategy (V-EdFinance)

```typescript
/**
 * ORM Decision Matrix
 * 
 * ┌──────────────────┬─────────┬──────────┬─────────┐
 * │ Use Case         │ Prisma  │ Drizzle  │ Kysely  │
 * ├──────────────────┼─────────┼──────────┼─────────┤
 * │ Schema Migration │   ✅    │    ❌    │   ❌    │
 * │ Type Generation  │   ✅    │    ✅    │   ✅    │
 * │ Simple CRUD      │   ⚠️    │    ✅    │   ⚠️    │
 * │ Complex Joins    │   ❌    │    ⚠️    │   ✅    │
 * │ Raw SQL          │   ⚠️    │    ⚠️    │   ✅    │
 * │ Batch Inserts    │   ⚠️    │    ✅    │   ✅    │
 * │ JSONB Queries    │   ⚠️    │    ✅    │   ✅    │
 * └──────────────────┴─────────┴──────────┴─────────┘
 * 
 * ✅ = Best choice
 * ⚠️ = Works but not optimal
 * ❌ = Avoid
 */
```

## Core Workflows

### 1. Schema Synchronization
```typescript
class SchemaSyncAgent {
  /**
   * Workflow: Prisma owns schema, Drizzle/Kysely sync from it
   */
  async syncSchemaFromPrisma() {
    console.log('🔄 Syncing Triple-ORM schemas...\n');
    
    // Step 1: Prisma is source of truth
    console.log('1️⃣ Running Prisma migration...');
    await execCommand('npx prisma migrate dev --name sync_triple_orm');
    await execCommand('npx prisma generate');
    
    // Step 2: Generate Drizzle schema from Prisma
    console.log('2️⃣ Generating Drizzle schema...');
    const prismaSchema = await this.parsePrismaSchema();
    const drizzleSchema = this.convertPrismaToDrizzle(prismaSchema);
    
    await fs.writeFile(
      'apps/api/src/database/drizzle-schema.ts',
      drizzleSchema
    );
    
    // Step 3: Generate Kysely types
    console.log('3️⃣ Generating Kysely types...');
    await execCommand('npx kysely-codegen --out-file=apps/api/src/database/kysely-types.ts');
    
    // Step 4: Verify consistency
    console.log('4️⃣ Verifying schema consistency...');
    const issues = await this.verifySchemaConsistency();
    
    if (issues.length > 0) {
      console.log('⚠️ Schema drift detected:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      throw new Error('Schema sync failed - fix drift before proceeding');
    }
    
    console.log('✅ Triple-ORM schema sync complete!\n');
  }
  
  convertPrismaToDrizzle(prismaSchema: PrismaSchema): string {
    // AI converts Prisma models to Drizzle schema
    return `
import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const users = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role: text('role').notNull().default('STUDENT'),
  points: integer('points').notNull().default(0),
  preferredLocale: text('preferredLocale').notNull().default('vi'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
}, (table) => ({
  emailIdx: index('User_email_idx').on(table.email),
  roleIdx: index('User_role_idx').on(table.role)
}));

export const behaviorLogs = pgTable('BehaviorLog', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id),
  action: text('action').notNull(),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('BehaviorLog_userId_idx').on(table.userId),
  timestampIdx: index('BehaviorLog_timestamp_idx').on(table.timestamp)
}));

// ... other tables
`;
  }
  
  async verifySchemaConsistency(): Promise<string[]> {
    const issues: string[] = [];
    
    // Compare Prisma vs actual DB schema
    const prismaModels = await this.getPrismaModels();
    const dbTables = await this.db.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
    `);
    
    for (const model of prismaModels) {
      const dbTable = dbTables.filter(t => t.table_name === model.name);
      
      if (dbTable.length === 0) {
        issues.push(`Table ${model.name} exists in Prisma but not in DB`);
      }
      
      for (const field of model.fields) {
        const dbColumn = dbTable.find(c => c.column_name === field.name);
        if (!dbColumn) {
          issues.push(`Column ${model.name}.${field.name} missing in DB`);
        }
      }
    }
    
    return issues;
  }
}
```

### 2. ORM Selection AI
```typescript
class OrmSelectionAgent {
  /**
   * AI automatically selects optimal ORM for query
   */
  selectOptimalOrm(queryIntent: string, context: any) {
    // Simple CRUD → Drizzle (65% faster)
    if (this.isSimpleCrud(queryIntent)) {
      return {
        orm: 'drizzle',
        reason: '65% faster than Prisma for simple reads',
        example: `
          // Drizzle (recommended)
          await db.select()
            .from(behaviorLogs)
            .where(eq(behaviorLogs.userId, userId))
            .limit(10);
        `
      };
    }
    
    // Complex joins → Kysely (most flexible)
    if (this.hasMultipleJoins(queryIntent)) {
      return {
        orm: 'kysely',
        reason: 'Type-safe complex joins with full SQL control',
        example: `
          // Kysely (recommended)
          await kysely
            .selectFrom('BehaviorLog as bl')
            .innerJoin('User as u', 'u.id', 'bl.userId')
            .leftJoin('Course as c', 'c.id', 'bl.courseId')
            .select(['bl.action', 'u.email', 'c.title'])
            .where('bl.timestamp', '>=', startDate)
            .execute();
        `
      };
    }
    
    // Batch operations → Drizzle (93% faster)
    if (this.isBatchOperation(queryIntent)) {
      return {
        orm: 'drizzle',
        reason: '93% faster batch inserts than Prisma',
        example: `
          // Drizzle (recommended)
          await db.insert(behaviorLogs).values([
            { userId: 'a', action: 'click' },
            { userId: 'b', action: 'scroll' },
            // ... 1000 more
          ]);
        `
      };
    }
    
    // JSONB queries → Drizzle or Kysely
    if (this.hasJsonbQuery(queryIntent)) {
      return {
        orm: 'drizzle',
        reason: 'Better JSONB operator support than Prisma',
        example: `
          // Drizzle (recommended)
          await db.select()
            .from(users)
            .where(sql\`metadata->>'displayName' = \${'John'}\`);
        `
      };
    }
    
    // Default: Prisma (familiarity)
    return {
      orm: 'prisma',
      reason: 'Standard CRUD with type safety',
      example: `
        // Prisma (default)
        await prisma.user.findUnique({ where: { id: userId } });
      `
    };
  }
  
  isSimpleCrud(query: string): boolean {
    const simpleCrudKeywords = ['findMany', 'findUnique', 'create', 'update', 'delete'];
    return simpleCrudKeywords.some(kw => query.includes(kw));
  }
  
  hasMultipleJoins(query: string): boolean {
    return (query.match(/join/gi) || []).length >= 2;
  }
  
  isBatchOperation(query: string): boolean {
    return query.includes('createMany') || query.includes('insertMany');
  }
  
  hasJsonbQuery(query: string): boolean {
    return query.includes('->') || query.includes('->>') || query.includes('metadata');
  }
}
```

### 3. Migration Safety Agent
```typescript
class MigrationSafetyAgent {
  async validateMigration(migrationSql: string) {
    console.log('🔍 Analyzing migration safety...\n');
    
    const risks = [];
    
    // Check 1: Breaking changes
    if (migrationSql.includes('DROP COLUMN') || migrationSql.includes('ALTER COLUMN')) {
      risks.push({
        level: 'HIGH',
        type: 'breaking_change',
        message: 'Migration contains schema changes that may break existing code',
        action: 'Review all code references to affected columns'
      });
    }
    
    // Check 2: Data loss potential
    if (migrationSql.includes('DROP TABLE') || migrationSql.includes('TRUNCATE')) {
      risks.push({
        level: 'CRITICAL',
        type: 'data_loss',
        message: 'Migration may delete data',
        action: 'STOP! Backup database before proceeding'
      });
    }
    
    // Check 3: Downtime estimation
    const locksTable = migrationSql.includes('ALTER TABLE');
    if (locksTable) {
      const affectedTable = this.extractTableName(migrationSql);
      const tableSize = await this.getTableSize(affectedTable);
      
      if (tableSize > 1_000_000) {
        risks.push({
          level: 'MEDIUM',
          type: 'potential_downtime',
          message: `ALTER TABLE on large table (${tableSize} rows) may lock for minutes`,
          action: 'Run during low-traffic window (2AM-4AM)'
        });
      }
    }
    
    // Check 4: Index rebuild time
    if (migrationSql.includes('CREATE INDEX')) {
      risks.push({
        level: 'LOW',
        type: 'index_rebuild',
        message: 'Index creation may take time on large tables',
        action: 'Use CREATE INDEX CONCURRENTLY to avoid locking'
      });
    }
    
    // Check 5: Triple-ORM sync required
    if (risks.length > 0) {
      risks.push({
        level: 'INFO',
        type: 'orm_sync',
        message: 'After migration, regenerate Drizzle + Kysely schemas',
        action: 'Run: pnpm sync-triple-orm'
      });
    }
    
    // Print report
    console.log('📋 Migration Safety Report:');
    for (const risk of risks) {
      const emoji = {
        CRITICAL: '🔴',
        HIGH: '🟠',
        MEDIUM: '🟡',
        LOW: '🟢',
        INFO: 'ℹ️'
      }[risk.level];
      
      console.log(`${emoji} [${risk.level}] ${risk.type}`);
      console.log(`   ${risk.message}`);
      console.log(`   → ${risk.action}\n`);
    }
    
    // Decision
    const hasCritical = risks.some(r => r.level === 'CRITICAL');
    if (hasCritical) {
      console.log('❌ Migration BLOCKED - resolve CRITICAL risks first\n');
      return false;
    }
    
    console.log('✅ Migration approved - proceed with caution\n');
    return true;
  }
}
```

### 4. Type Safety Enforcer
```typescript
class TypeSafetyEnforcer {
  /**
   * Ensure all ORMs have matching types
   */
  async validateTypeSafety() {
    console.log('🔒 Validating type safety across ORMs...\n');
    
    // Extract types from each ORM
    const prismaTypes = await this.extractPrismaTypes();
    const drizzleTypes = await this.extractDrizzleTypes();
    const kyselyTypes = await this.extractKyselyTypes();
    
    // Compare User model across ORMs
    const userTypeMismatches = this.compareTypes('User', {
      prisma: prismaTypes.User,
      drizzle: drizzleTypes.users,
      kysely: kyselyTypes.User
    });
    
    if (userTypeMismatches.length > 0) {
      console.log('⚠️ Type mismatches detected in User model:');
      userTypeMismatches.forEach(m => console.log(`  - ${m}`));
    }
    
    // Validate JSONB field types
    const jsonbFields = ['metadata', 'settings', 'content'];
    for (const field of jsonbFields) {
      const hasZodValidation = await this.checkZodSchema(field);
      if (!hasZodValidation) {
        console.log(`⚠️ JSONB field "${field}" missing Zod validation`);
        console.log(`   → Add schema to SchemaRegistry for type safety`);
      }
    }
    
    console.log('✅ Type safety validation complete\n');
  }
  
  compareTypes(modelName: string, types: any): string[] {
    const mismatches: string[] = [];
    
    // Check field presence
    const prismaFields = Object.keys(types.prisma);
    const drizzleFields = Object.keys(types.drizzle);
    const kyselyFields = Object.keys(types.kysely);
    
    // Prisma vs Drizzle
    const missingInDrizzle = prismaFields.filter(f => !drizzleFields.includes(f));
    if (missingInDrizzle.length > 0) {
      mismatches.push(`Drizzle missing fields: ${missingInDrizzle.join(', ')}`);
    }
    
    // Prisma vs Kysely
    const missingInKysely = prismaFields.filter(f => !kyselyFields.includes(f));
    if (missingInKysely.length > 0) {
      mismatches.push(`Kysely missing fields: ${missingInKysely.join(', ')}`);
    }
    
    return mismatches;
  }
}
```

## V-EdFinance Usage Patterns

### Pattern 1: BehaviorLog Tracking (Use Drizzle)
```typescript
// ✅ CORRECT: Use Drizzle for high-frequency writes
import { db } from '@/database/drizzle';
import { behaviorLogs } from '@/database/drizzle-schema';

await db.insert(behaviorLogs).values({
  userId,
  action: 'lesson_complete',
  metadata: { lessonId, duration: 350 }
});

// ❌ AVOID: Prisma slower for batch inserts
await prisma.behaviorLog.create({
  data: { userId, action: 'lesson_complete', metadata: {...} }
});
```

### Pattern 2: Analytics Queries (Use Kysely)
```typescript
// ✅ CORRECT: Use Kysely for complex analytics
import { kysely } from '@/database/kysely';

const stats = await kysely
  .selectFrom('BehaviorLog as bl')
  .innerJoin('User as u', 'u.id', 'bl.userId')
  .select([
    'u.preferredLocale',
    kysely.fn.count('bl.id').as('total_actions'),
    kysely.fn.avg('bl.metadata->duration').as('avg_duration')
  ])
  .where('bl.timestamp', '>=', startDate)
  .groupBy('u.preferredLocale')
  .execute();

// ❌ AVOID: Prisma requires multiple queries + manual aggregation
```

### Pattern 3: Schema Migrations (Use Prisma ONLY)
```typescript
// ✅ CORRECT: Prisma owns schema
// 1. Edit apps/api/prisma/schema.prisma
// 2. Run migration
npx prisma migrate dev --name add_pgvector

// 3. Sync other ORMs
pnpm sync-triple-orm

// ❌ NEVER: Direct Drizzle/Kysely migrations
// ❌ drizzle-kit push  // Will cause drift!
```

## Automated Workflows

### Weekly Schema Health Check
```bash
# Cron: Every Monday 9AM
pnpm check-schema-health

# AI verifies:
# 1. Prisma schema = DB schema
# 2. Drizzle schema = Prisma schema
# 3. Kysely types = DB schema
# 4. No orphaned migrations
# 5. No unused indexes
```

### Pre-Deployment Validation
```bash
# GitHub Actions workflow
- name: Validate Triple-ORM Sync
  run: |
    pnpm sync-triple-orm
    pnpm build  # Verify types compile
    git diff --exit-code  # No uncommitted schema changes
```

---

**📌 Skill Context**: AI agent đảm bảo Triple-ORM hoạt động nhịp nhàng, tự động select ORM tối ưu, validate migrations, và maintain type safety across Prisma/Drizzle/Kysely.
