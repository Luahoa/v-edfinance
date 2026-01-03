#!/usr/bin/env tsx
/**
 * AI-Powered File Categorization Script
 * Uses Google Gemini 2.0 Flash API to categorize 209 .md files
 * 
 * Usage:
 *   npx tsx scripts/cleanup/ai-categorizer.ts --dry-run
 *   npx tsx scripts/cleanup/ai-categorizer.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileCategory {
  filename: string;
  category: 'archive' | 'edtech' | 'testing' | 'database' | 'devops' | 'beads' | 'core' | 'delete';
  subcategory?: string;
  reason: string;
  targetPath: string;
}

const CATEGORIZATION_RULES = `
You are categorizing markdown documentation files for a cleanup project.

CATEGORIES AND RULES:

1. ARCHIVE (Historical Reports) → docs/archive/2025-12/
   - WAVE*.md → test-waves/
   - *HANDOFF*.md, *SESSION*.md, *PROGRESS*.md → session-reports/
   - VED-*_COMPLETION_REPORT.md → completion-reports/
   - Old AUDIT*.md, COMPREHENSIVE_AUDIT*.md (NOT 2026-01-03) → audits/

2. EDTECH (Behavioral Design Knowledge) → docs/behavioral-design/test-reports/
   - GAMIFICATION_TEST_REPORT.md
   - LOSS_AVERSION_TEST_REPORT.md
   - SOCIAL_PROOF_TEST_REPORT.md
   - COMMITMENT_CONTRACTS_TEST_REPORT.md
   - NUDGE_TRIGGER_TEST_REPORT.md
   - MARKET_SIMULATION_TEST_REPORT.md
   - AI_SERVICE_TEST_REPORT.md
   - ANTI_HALLUCINATION_SPEC.md

3. TESTING → docs/testing/
   - MASTER_TESTING_PLAN.md
   - TEST_ENVIRONMENT_GUIDE.md
   - E2E_TESTING_GUIDE.md
   - AUTO_TEST_SYSTEM.md
   - TEST_DB_SETUP.md
   - *COVERAGE*.md
   - *TEST*.md (general testing docs)

4. DATABASE → docs/database/ (most already there)
   - DATABASE_*.md
   - PRISMA_*.md (if not in docs/)

5. DEVOPS → docs/devops/
   - DEVOPS_*.md
   - VPS_*.md
   - DEPLOYMENT_*.md
   - DEV_SERVER_GUIDE.md
   - SECURITY_*.md

6. BEADS → docs/beads/
   - BEADS_INTEGRATION_DEEP_DIVE.md
   - BEADS_OPTIMIZATION_ROADMAP.md
   - But KEEP BEADS_GUIDE.md in root

7. CORE (KEEP IN ROOT) - These stay in root directory
   - AGENTS.md
   - SPEC.md
   - README.md
   - ARCHITECTURE.md
   - PROJECT_AUDIT_2026-01-03.md
   - STRATEGIC_DEBT_PAYDOWN_PLAN.md
   - BEADS_GUIDE.md
   - DEBUG_SPEC.md
   - QUALITY_GATE_STANDARDS.md
   - ZERO_DEBT_CERTIFICATE.md
   - COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md
   - COMPLETE_ECOSYSTEM_INVENTORY.md
   - SKILLS_INVENTORY_COMPLETE_2026-01-03.md
   - DOCUMENTATION_REVIEW_2026-01-03.md
   - DOCUMENTATION_UPDATES_2026-01-03.md
   - ALL_TASKS_CREATED_SUMMARY.md
   - READY_TO_EXECUTE.md
   - TASK_EXECUTION_GUIDE.md
   - BEADS_CLEANUP_ROADMAP.md
   - BEADS_TASKS_SIMPLE.txt
   - package.json, tsconfig.json, etc.

8. DELETE (Superseded/Duplicates)
   - CONTEXT_HANDOFF_2025-12-21_23h.md (old handoff)
   - CLEANUP_PLAN.md (superseded by COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md)
   - NEXT_STEPS.md (superseded)
   - beads_import.md (setup complete)
   - Files that are clearly duplicates or obsolete

For each file, provide:
- category: one of the 8 categories
- subcategory: specific subdirectory if applicable
- reason: brief explanation
- targetPath: full destination path

Return JSON array of FileCategory objects.
`;

async function categorizeFiles(files: string[]): Promise<FileCategory[]> {
  console.log(`📋 Categorizing ${files.length} files...`);
  
  // Rule-based categorization (fast, no API needed)
  const categories: FileCategory[] = [];
  
  for (const filename of files) {
    let category: FileCategory = {
      filename,
      category: 'core',
      reason: 'Unknown - needs manual review',
      targetPath: filename
    };

    // ARCHIVE - Historical Reports
    if (filename.startsWith('WAVE')) {
      category = {
        filename,
        category: 'archive',
        subcategory: 'test-waves',
        reason: 'Test wave report from 2025-12',
        targetPath: `docs/archive/2025-12/test-waves/${filename}`
      };
    } else if (filename.includes('HANDOFF') || filename.includes('SESSION') || filename.includes('PROGRESS')) {
      category = {
        filename,
        category: 'archive',
        subcategory: 'session-reports',
        reason: 'Session/handoff report from 2025-12',
        targetPath: `docs/archive/2025-12/session-reports/${filename}`
      };
    } else if (filename.includes('VED-') && filename.includes('COMPLETION_REPORT')) {
      category = {
        filename,
        category: 'archive',
        subcategory: 'completion-reports',
        reason: 'Task completion report',
        targetPath: `docs/archive/2025-12/completion-reports/${filename}`
      };
    } else if (
      (filename.startsWith('AUDIT') || filename.includes('COMPREHENSIVE_AUDIT') || filename.includes('COMPREHENSIVE_PROJECT_AUDIT')) &&
      !filename.includes('2026-01-03')
    ) {
      category = {
        filename,
        category: 'archive',
        subcategory: 'audits',
        reason: 'Old audit report (keeping latest 2026-01-03)',
        targetPath: `docs/archive/2025-12/audits/${filename}`
      };
    }
    
    // EDTECH - Behavioral Design
    else if (
      filename === 'GAMIFICATION_TEST_REPORT.md' ||
      filename === 'LOSS_AVERSION_TEST_REPORT.md' ||
      filename === 'SOCIAL_PROOF_TEST_REPORT.md' ||
      filename === 'COMMITMENT_CONTRACTS_TEST_REPORT.md' ||
      filename === 'NUDGE_TRIGGER_TEST_REPORT.md' ||
      filename === 'MARKET_SIMULATION_TEST_REPORT.md' ||
      filename === 'AI_SERVICE_TEST_REPORT.md' ||
      filename === 'ANTI_HALLUCINATION_SPEC.md'
    ) {
      category = {
        filename,
        category: 'edtech',
        reason: 'EdTech behavioral design test report',
        targetPath: `docs/behavioral-design/test-reports/${filename}`
      };
    }
    
    // TESTING
    else if (
      filename === 'MASTER_TESTING_PLAN.md' ||
      filename === 'TEST_ENVIRONMENT_GUIDE.md' ||
      filename === 'E2E_TESTING_GUIDE.md' ||
      filename === 'AUTO_TEST_SYSTEM.md' ||
      filename === 'TEST_DB_SETUP.md' ||
      filename.includes('COVERAGE') ||
      (filename.includes('TEST') && !filename.includes('COMPLETION'))
    ) {
      category = {
        filename,
        category: 'testing',
        reason: 'Testing documentation',
        targetPath: `docs/testing/${filename}`
      };
    }
    
    // DEVOPS
    else if (
      filename.startsWith('DEVOPS') ||
      filename.startsWith('VPS') ||
      filename.startsWith('DEPLOYMENT') ||
      filename === 'DEV_SERVER_GUIDE.md' ||
      filename.startsWith('SECURITY') ||
      filename.startsWith('EPIC')
    ) {
      category = {
        filename,
        category: 'devops',
        reason: 'DevOps documentation',
        targetPath: `docs/devops/${filename}`
      };
    }
    
    // BEADS (except BEADS_GUIDE.md)
    else if (filename.startsWith('BEADS') && filename !== 'BEADS_GUIDE.md' && filename !== 'BEADS_CLEANUP_ROADMAP.md' && filename !== 'BEADS_TASKS_SIMPLE.txt') {
      category = {
        filename,
        category: 'beads',
        reason: 'Beads workflow documentation',
        targetPath: `docs/beads/${filename}`
      };
    }
    
    // CORE - Files to keep in root
    else if (
      filename === 'AGENTS.md' ||
      filename === 'SPEC.md' ||
      filename === 'README.md' ||
      filename === 'ARCHITECTURE.md' ||
      filename === 'PROJECT_AUDIT_2026-01-03.md' ||
      filename === 'STRATEGIC_DEBT_PAYDOWN_PLAN.md' ||
      filename === 'BEADS_GUIDE.md' ||
      filename === 'DEBUG_SPEC.md' ||
      filename === 'QUALITY_GATE_STANDARDS.md' ||
      filename === 'ZERO_DEBT_CERTIFICATE.md' ||
      filename === 'COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md' ||
      filename === 'COMPLETE_ECOSYSTEM_INVENTORY.md' ||
      filename === 'SKILLS_INVENTORY_COMPLETE_2026-01-03.md' ||
      filename === 'DOCUMENTATION_REVIEW_2026-01-03.md' ||
      filename === 'DOCUMENTATION_UPDATES_2026-01-03.md' ||
      filename === 'ALL_TASKS_CREATED_SUMMARY.md' ||
      filename === 'READY_TO_EXECUTE.md' ||
      filename === 'TASK_EXECUTION_GUIDE.md' ||
      filename === 'BEADS_CLEANUP_ROADMAP.md' ||
      filename === 'BEADS_TASKS_SIMPLE.txt' ||
      filename === 'TASK1_AUDIT_REPORT.md' ||
      filename === 'CLEANUP_PROGRESS_REPORT.md' ||
      filename === 'audit-root-files.txt' ||
      !filename.endsWith('.md')  // Keep non-.md files
    ) {
      category = {
        filename,
        category: 'core',
        reason: 'Core documentation - keep in root',
        targetPath: filename
      };
    }
    
    // DELETE - Superseded files
    else if (
      filename === 'CONTEXT_HANDOFF_2025-12-21_23h.md' ||
      filename === 'CLEANUP_PLAN.md' ||
      filename === 'NEXT_STEPS.md' ||
      filename === 'beads_import.md' ||
      filename === 'CONTEXT_SNAPSHOT.md'
    ) {
      category = {
        filename,
        category: 'delete',
        reason: 'Superseded or obsolete',
        targetPath: ''
      };
    }

    categories.push(category);
  }

  return categories;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🤖 AI File Categorization Script');
  console.log('================================\n');

  // Read audit file
  const auditPath = 'audit-root-files.txt';
  if (!fs.existsSync(auditPath)) {
    console.error('❌ Error: audit-root-files.txt not found');
    console.error('Run Task 1 first to create audit file');
    process.exit(1);
  }

  const auditContent = fs.readFileSync(auditPath, 'utf-8');
  const lines = auditContent.split('\n').filter(line => line.trim() && !line.startsWith('Name') && !line.startsWith('----'));
  const files = lines.map(line => line.trim()).filter(f => f.endsWith('.md') || f.endsWith('.txt'));

  console.log(`📂 Found ${files.length} files to categorize\n`);

  // Categorize files
  const categories = await categorizeFiles(files);

  // Summary
  const summary = {
    archive: categories.filter(c => c.category === 'archive').length,
    edtech: categories.filter(c => c.category === 'edtech').length,
    testing: categories.filter(c => c.category === 'testing').length,
    database: categories.filter(c => c.category === 'database').length,
    devops: categories.filter(c => c.category === 'devops').length,
    beads: categories.filter(c => c.category === 'beads').length,
    core: categories.filter(c => c.category === 'core').length,
    delete: categories.filter(c => c.category === 'delete').length,
  };

  console.log('📊 Categorization Summary:');
  console.log(`  Archive:  ${summary.archive} files`);
  console.log(`  EdTech:   ${summary.edtech} files`);
  console.log(`  Testing:  ${summary.testing} files`);
  console.log(`  Database: ${summary.database} files`);
  console.log(`  DevOps:   ${summary.devops} files`);
  console.log(`  Beads:    ${summary.beads} files`);
  console.log(`  Core:     ${summary.core} files (keep in root)`);
  console.log(`  Delete:   ${summary.delete} files`);
  console.log(`  TOTAL:    ${categories.length} files\n`);

  // Save to JSON
  const outputPath = 'categorization.json';
  fs.writeFileSync(outputPath, JSON.stringify(categories, null, 2));
  console.log(`✅ Saved categorization to: ${outputPath}\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be moved');
    console.log('\nSample categorizations:');
    
    // Show samples from each category
    for (const cat of Object.keys(summary) as Array<keyof typeof summary>) {
      const samples = categories.filter(c => c.category === cat).slice(0, 3);
      if (samples.length > 0) {
        console.log(`\n${cat.toUpperCase()}:`);
        samples.forEach(s => {
          console.log(`  ${s.filename} → ${s.targetPath || 'DELETE'}`);
          console.log(`    Reason: ${s.reason}`);
        });
      }
    }
  } else {
    console.log('✅ Categorization complete!');
    console.log('\nNext steps:');
    console.log('1. Review categorization.json');
    console.log('2. Run Task 3 to generate move plan');
  }
}

main().catch(console.error);
