#!/usr/bin/env tsx
/**
 * Generate Automated Move Plan
 * Reads categorization.json and generates PowerShell move script
 *
 * Usage:
 *   npx tsx scripts/cleanup/generate-move-plan.ts
 */

import * as fs from 'node:fs';

interface FileCategory {
  filename: string;
  category: string;
  subcategory?: string;
  reason: string;
  targetPath: string;
}

function generatePowerShellScript(categories: FileCategory[]): string {
  const script: string[] = [];

  // Header
  script.push('# Auto-Generated File Move Script');
  script.push(`# Generated: ${new Date().toISOString()}`);
  script.push('# DO NOT EDIT - Regenerate from categorization.json if needed');
  script.push('');
  script.push('param(');
  script.push('    [string]$DryRun = "true"  # Set to "false" to actually move files');
  script.push(')');
  script.push('');
  script.push('Write-Host "📦 File Move Script" -ForegroundColor Cyan');
  script.push('Write-Host "===================" -ForegroundColor Cyan');
  script.push('Write-Host ""');
  script.push('');
  script.push('if ($DryRun -eq "true") {');
  script.push('    Write-Host "🔍 DRY RUN MODE - No files will be moved" -ForegroundColor Yellow');
  script.push('} else {');
  script.push('    Write-Host "⚠️  LIVE MODE - Files will be moved!" -ForegroundColor Red');
  script.push('    $confirm = Read-Host "Type YES to confirm"');
  script.push('    if ($confirm -ne "YES") {');
  script.push('        Write-Host "Aborted" -ForegroundColor Red');
  script.push('        exit 1');
  script.push('    }');
  script.push('}');
  script.push('Write-Host ""');
  script.push('');

  // Group by category
  const byCategory: Record<string, FileCategory[]> = {};
  categories.forEach((cat) => {
    if (!byCategory[cat.category]) {
      byCategory[cat.category] = [];
    }
    byCategory[cat.category].push(cat);
  });

  // Generate moves for each category
  for (const [category, files] of Object.entries(byCategory)) {
    if (category === 'core') {
      script.push('# ═══════════════════════════════════════════════════════════');
      script.push(`# CORE FILES (${files.length} files) - KEEP IN ROOT`);
      script.push('# ═══════════════════════════════════════════════════════════');
      script.push('');
      script.push(
        `Write-Host "✅ Core files: ${files.length} files (keeping in root)" -ForegroundColor Green`
      );
      script.push('Write-Host ""');
      script.push('');
      continue;
    }

    if (category === 'delete') {
      script.push('# ═══════════════════════════════════════════════════════════');
      script.push(`# DELETE FILES (${files.length} files)`);
      script.push('# ═══════════════════════════════════════════════════════════');
      script.push('');
      script.push(`Write-Host "🗑️  Delete: ${files.length} files" -ForegroundColor Yellow`);

      for (const file of files) {
        script.push('');
        script.push(`# ${file.filename}`);
        script.push(`# Reason: ${file.reason}`);
        script.push('if ($DryRun -eq "false") {');
        script.push(`    if (Test-Path "${file.filename}") {`);
        script.push(`        Remove-Item "${file.filename}"`);
        script.push(`        Write-Host "  ❌ Deleted: ${file.filename}"`);
        script.push('    }');
        script.push('} else {');
        script.push(`    Write-Host "  🔍 Would delete: ${file.filename}"`);
        script.push('}');
      }
      script.push('Write-Host ""');
      script.push('');
      continue;
    }

    script.push('# ═══════════════════════════════════════════════════════════');
    script.push(`# ${category.toUpperCase()} (${files.length} files)`);
    script.push('# ═══════════════════════════════════════════════════════════');
    script.push('');
    script.push(
      `Write-Host "${getCategoryIcon(category)} ${capitalizeFirst(category)}: ${files.length} files" -ForegroundColor Cyan`
    );

    // Group by target directory
    const byTarget: Record<string, FileCategory[]> = {};
    files.forEach((f) => {
      const targetDir = f.targetPath.substring(0, f.targetPath.lastIndexOf('/'));
      if (!byTarget[targetDir]) {
        byTarget[targetDir] = [];
      }
      byTarget[targetDir].push(f);
    });

    for (const [targetDir, targetFiles] of Object.entries(byTarget)) {
      script.push('');
      script.push(`# Target: ${targetDir}/ (${targetFiles.length} files)`);

      for (const file of targetFiles) {
        const destDir = file.targetPath.substring(0, file.targetPath.lastIndexOf('/'));
        script.push('');
        script.push(`# ${file.filename} → ${destDir}/`);
        script.push('if ($DryRun -eq "false") {');
        script.push(`    if (Test-Path "${file.filename}") {`);
        script.push(`        New-Item -ItemType Directory -Force -Path "${destDir}" | Out-Null`);
        script.push(`        Move-Item "${file.filename}" "${file.targetPath}"`);
        script.push(`        Write-Host "  ✅ Moved: ${file.filename}"`);
        script.push('    }');
        script.push('} else {');
        script.push(`    Write-Host "  🔍 Would move: ${file.filename} → ${destDir}/"`);
        script.push('}');
      }
    }

    script.push('Write-Host ""');
    script.push('');
  }

  // Summary
  script.push('# ═══════════════════════════════════════════════════════════');
  script.push('# SUMMARY');
  script.push('# ═══════════════════════════════════════════════════════════');
  script.push('');
  script.push('Write-Host "📊 Summary:" -ForegroundColor Cyan');

  for (const [category, files] of Object.entries(byCategory)) {
    if (category === 'core') {
      script.push(
        `Write-Host "  Core (keep):  ${files.length.toString().padStart(3)} files" -ForegroundColor Green`
      );
    } else if (category === 'delete') {
      script.push(
        `Write-Host "  Delete:       ${files.length.toString().padStart(3)} files" -ForegroundColor Yellow`
      );
    } else {
      script.push(
        `Write-Host "  ${capitalizeFirst(category).padEnd(13)}: ${files.length.toString().padStart(3)} files"`
      );
    }
  }

  script.push('Write-Host ""');
  script.push('');
  script.push('if ($DryRun -eq "true") {');
  script.push('    Write-Host "✅ Dry run complete - No files were moved" -ForegroundColor Green');
  script.push('    Write-Host ""');
  script.push('    Write-Host "To execute for real, run:" -ForegroundColor Yellow');
  script.push('    Write-Host "  .\\move-files.ps1 -DryRun false" -ForegroundColor White');
  script.push('} else {');
  script.push('    Write-Host "✅ Move complete!" -ForegroundColor Green');
  script.push('}');
  script.push('');

  return script.join('\n');
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    archive: '📦',
    edtech: '🎓',
    testing: '🧪',
    database: '🗄️',
    devops: '⚙️',
    beads: '🔄',
    core: '✅',
    delete: '🗑️',
  };
  return icons[category] || '📄';
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function main() {
  console.log('⚙️  Generate Automated Move Plan');
  console.log('=================================\n');

  // Read categorization
  const categorizationPath = 'categorization.json';
  if (!fs.existsSync(categorizationPath)) {
    console.error('❌ Error: categorization.json not found');
    console.error('Run Task 2 first to create categorization');
    process.exit(1);
  }

  const categories: FileCategory[] = JSON.parse(fs.readFileSync(categorizationPath, 'utf-8'));

  console.log(`📂 Loaded ${categories.length} file categorizations\n`);

  // Generate PowerShell script
  console.log('🔨 Generating PowerShell move script...');
  const script = generatePowerShellScript(categories);

  // Save script
  const scriptPath = 'move-files.ps1';
  fs.writeFileSync(scriptPath, script);
  console.log(`✅ Saved move script to: ${scriptPath}\n`);

  // Generate summary
  const byCategory: Record<string, number> = {};
  categories.forEach((cat) => {
    byCategory[cat.category] = (byCategory[cat.category] || 0) + 1;
  });

  console.log('📊 Move Plan Summary:');
  console.log(`  Archive:  ${byCategory.archive || 0} files → docs/archive/2025-12/`);
  console.log(`  EdTech:   ${byCategory.edtech || 0} files → docs/behavioral-design/test-reports/`);
  console.log(`  Testing:  ${byCategory.testing || 0} files → docs/testing/`);
  console.log(`  Database: ${byCategory.database || 0} files → docs/database/`);
  console.log(`  DevOps:   ${byCategory.devops || 0} files → docs/devops/`);
  console.log(`  Beads:    ${byCategory.beads || 0} files → docs/beads/`);
  console.log(`  Core:     ${byCategory.core || 0} files → (keep in root)`);
  console.log(`  Delete:   ${byCategory.delete || 0} files → (remove)`);
  console.log('');

  console.log('✅ Move plan generated!\n');
  console.log('Next steps:');
  console.log('1. Review move-files.ps1');
  console.log('2. Test with dry-run: .\\move-files.ps1 -DryRun true');
  console.log('3. Execute for real: .\\move-files.ps1 -DryRun false');
  console.log('');
}

main().catch(console.error);
