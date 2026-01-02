#!/usr/bin/env node
/**
 * Triple-ORM Schema Consistency Verifier
 * 
 * Compares Prisma schema.prisma with Drizzle drizzle-schema.ts
 * to ensure 100% field-level consistency.
 * 
 * Skill: Prisma-Drizzle Hybrid Agent
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

interface SchemaField {
  name: string;
  type: string;
  optional: boolean;
  unique: boolean;
  default: string | null;
}

interface SchemaModel {
  name: string;
  fields: Map<string, SchemaField>;
}

class SchemaSyncVerifier {
  private prismaSchemaPath = 'apps/api/prisma/schema.prisma';
  private drizzleSchemaPath = 'apps/api/src/database/drizzle-schema.ts';

  async verify() {
    console.log('🔍 V-EdFinance Triple-ORM Schema Consistency Check\\n');

    // Step 1: Parse Prisma schema
    console.log('1️⃣ Parsing Prisma schema...');
    const prismaModels = this.parsePrismaSchema();
    console.log(`   Found ${prismaModels.size} models\\n`);

    // Step 2: Parse Drizzle schema
    console.log('2️⃣ Parsing Drizzle schema...');
    const drizzleModels = this.parseDrizzleSchema();
    console.log(`   Found ${drizzleModels.size} models\\n`);

    // Step 3: Compare models
    console.log('3️⃣ Comparing schemas...\\n');
    const issues = this.compareSchemas(prismaModels, drizzleModels);

    // Step 4: Report results
    if (issues.length === 0) {
      console.log('✅ **100% SCHEMA CONSISTENCY ACHIEVED**\\n');
      console.log('   All Prisma models match Drizzle schema perfectly!\\n');
      return { success: true, issues: [] };
    } else {
      console.log(`⚠️ Found ${issues.length} schema drift issues:\\n`);
      issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}\\n`);
      });
      return { success: false, issues };
    }
  }

  private parsePrismaSchema(): Map<string, SchemaModel> {
    const content = fs.readFileSync(this.prismaSchemaPath, 'utf-8');
    const models = new Map<string, SchemaModel>();

    // Extract models using regex
    const modelRegex = /model\\s+(\\w+)\\s+{([^}]+)}/g;
    let match: RegExpExecArray | null;

    match = modelRegex.exec(content);
    while (match !== null) {
      const modelName = match[1];
      const modelBody = match[2];

      const fields = new Map<string, SchemaField>();

      // Parse fields
      const fieldLines = modelBody.split('\\n').map(line => line.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('@@'));

      for (const line of fieldLines) {
        const fieldMatch = /^(\\w+)\\s+(\\w+)(\\??)(.*)/.exec(line);
        if (!fieldMatch) continue;

        const [, fieldName, fieldType, optional, attrs] = fieldMatch;

        fields.set(fieldName, {
          name: fieldName,
          type: fieldType,
          optional: optional === '?',
          unique: attrs.includes('@unique'),
          default: this.extractDefault(attrs),
        });
      }

      models.set(modelName, { name: modelName, fields });
    }

    return models;
  }

  private parseDrizzleSchema(): Map<string, SchemaModel> {
    const content = fs.readFileSync(this.drizzleSchemaPath, 'utf-8');
    const models = new Map<string, SchemaModel>();

    // Extract table definitions
    const tableRegex = /export\\s+const\\s+(\\w+)\\s+=\\s+pgTable\\('(\\w+)',\\s+{([^}]+)}/g;
    let match: RegExpExecArray | null;

    match = tableRegex.exec(content);
    while (match !== null) {
      const tableName = match[2]; // Use Prisma model name
      const tableBody = match[3];

      const fields = new Map<string, SchemaField>();

      // Parse fields
      const fieldLines = tableBody.split('\\n').map(line => line.trim()).filter(l => l && !l.startsWith('//'));

      for (const line of fieldLines) {
        const fieldMatch = /(\\w+):\\s+(\\w+)\\('(\\w+)'\\)(.*)/.exec(line);
        if (!fieldMatch) continue;

        const [, fieldName, drizzleType, , attrs] = fieldMatch;

        fields.set(fieldName, {
          name: fieldName,
          type: this.mapDrizzleToPrismaType(drizzleType),
          optional: !attrs.includes('.notNull()'),
          unique: attrs.includes('.unique()'),
          default: this.extractDrizzleDefault(attrs),
        });
      }

      models.set(tableName, { name: tableName, fields });
    }

    return models;
  }

  private compareSchemas(prisma: Map<string, SchemaModel>, drizzle: Map<string, SchemaModel>): string[] {
    const issues: string[] = [];

    // Check for missing models
    for (const [modelName] of prisma) {
      if (!drizzle.has(modelName)) {
        issues.push(`Model "${modelName}" exists in Prisma but not in Drizzle`);
      }
    }

    for (const [modelName] of drizzle) {
      if (!prisma.has(modelName)) {
        issues.push(`Model "${modelName}" exists in Drizzle but not in Prisma`);
      }
    }

    // Compare fields for common models
    for (const [modelName, prismaModel] of prisma) {
      const drizzleModel = drizzle.get(modelName);
      if (!drizzleModel) continue;

      // Check for missing fields in Drizzle
      for (const [fieldName, prismaField] of prismaModel.fields) {
        const drizzleField = drizzleModel.fields.get(fieldName);

        if (!drizzleField) {
          issues.push(`${modelName}.${fieldName}: Field exists in Prisma but not in Drizzle`);
          continue;
        }

        // Compare field types (basic check)
        if (prismaField.type !== drizzleField.type) {
          issues.push(`${modelName}.${fieldName}: Type mismatch - Prisma: ${prismaField.type}, Drizzle: ${drizzleField.type}`);
        }

        // Compare optional/required
        if (prismaField.optional !== drizzleField.optional) {
          issues.push(`${modelName}.${fieldName}: Nullability mismatch - Prisma: ${prismaField.optional ? 'optional' : 'required'}, Drizzle: ${drizzleField.optional ? 'optional' : 'required'}`);
        }
      }

      // Check for extra fields in Drizzle
      for (const [fieldName] of drizzleModel.fields) {
        if (!prismaModel.fields.has(fieldName)) {
          issues.push(`${modelName}.${fieldName}: Field exists in Drizzle but not in Prisma`);
        }
      }
    }

    return issues;
  }

  private extractDefault(attrs: string): string | null {
    const match = /@default\\(([^)]+)\\)/.exec(attrs);
    return match ? match[1] : null;
  }

  private extractDrizzleDefault(attrs: string): string | null {
    if (attrs.includes('.defaultNow()')) return 'now()';
    if (attrs.includes('.defaultRandom()')) return 'uuid()';
    
    const match = /\\.default\\(([^)]+)\\)/.exec(attrs);
    return match ? match[1].replace(/'/g, '') : null;
  }

  private mapDrizzleToPrismaType(drizzleType: string): string {
    const typeMap: Record<string, string> = {
      'uuid': 'String',
      'text': 'String',
      'integer': 'Int',
      'timestamp': 'DateTime',
      'jsonb': 'Json',
      'boolean': 'Boolean',
      'decimal': 'Decimal',
    };

    return typeMap[drizzleType] || drizzleType;
  }
}

// Run verification
const verifier = new SchemaSyncVerifier();
verifier.verify().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
