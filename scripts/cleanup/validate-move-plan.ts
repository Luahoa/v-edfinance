#!/usr/bin/env node
/**
 * Validate Move Plan Script
 * Validates that move-files.ps1 matches categorization.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileCategory {
  filename: string;
  category: string;
  subcategory?: string;
  reason: string;
  targetPath: string;
}

async function validateMovePlan() {
  console.log('📋 Validating Move Plan...\n');

  // 1. Read categorization.json
  const categorizationPath = path.join(process.cwd(), 'categorization.json');
  const categorization: FileCategory[] = JSON.parse(
    fs.readFileSync(categorizationPath, 'utf-8')
  );

  // 2. Read move-files.ps1
  const moveScriptPath = path.join(process.cwd(), 'move-files.ps1');
  const moveScript = fs.readFileSync(moveScriptPath, 'utf-8');

  // 3. Count categories
  const categoryCounts = categorization.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Category Distribution:');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const percent = ((count / categorization.length) * 100).toFixed(1);
      console.log(`  ${category.padEnd(12)} ${String(count).padStart(3)} files (${percent.padStart(5)}%)`);
    });
  console.log(`  ${'TOTAL'.padEnd(12)} ${String(categorization.length).padStart(3)} files\n`);

  // 4. Validate moves in script
  let validationErrors = 0;
  const filesToMove = categorization.filter(f => 
    f.category !== 'core' && f.category !== 'delete'
  );

  console.log('🔍 Validating Move Commands...\n');

  for (const file of filesToMove) {
    const expectedMove = `Move-Item "${file.filename}" "${file.targetPath}"`;
    const expectedCheck = `if (Test-Path "${file.filename}")`;
    
    if (!moveScript.includes(file.filename)) {
      console.log(`  ❌ Missing: ${file.filename}`);
      validationErrors++;
    } else if (!moveScript.includes(file.targetPath)) {
      console.log(`  ⚠️  Wrong path: ${file.filename} → ${file.targetPath}`);
      validationErrors++;
    }
  }

  // 5. Validate delete operations
  const filesToDelete = categorization.filter(f => f.category === 'delete');
  console.log(`\n🗑️  Files to Delete: ${filesToDelete.length}`);
  filesToDelete.forEach(f => console.log(`  - ${f.filename}`));

  // 6. Validate core files (should NOT be in move script)
  const coreFiles = categorization.filter(f => f.category === 'core');
  console.log(`\n✅ Core Files (keep in root): ${coreFiles.length}`);
  
  let coreMoveErrors = 0;
  for (const file of coreFiles) {
    if (moveScript.includes(`Move-Item "${file.filename}"`)) {
      console.log(`  ❌ ERROR: Core file in move script: ${file.filename}`);
      coreMoveErrors++;
    }
  }

  // 7. Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 VALIDATION SUMMARY\n');
  console.log(`Total files categorized:  ${categorization.length}`);
  console.log(`Files to move:            ${filesToMove.length}`);
  console.log(`Files to delete:          ${filesToDelete.length}`);
  console.log(`Core files (keep):        ${coreFiles.length}`);
  console.log(`\nValidation errors:        ${validationErrors}`);
  console.log(`Core file move errors:    ${coreMoveErrors}`);
  
  if (validationErrors === 0 && coreMoveErrors === 0) {
    console.log('\n✅ VALIDATION PASSED - Move script is correct!');
    return 0;
  } else {
    console.log('\n❌ VALIDATION FAILED - Fix errors before proceeding');
    return 1;
  }
}

validateMovePlan().then(code => process.exit(code));
