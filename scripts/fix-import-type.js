/**
 * Fix "import type" for injectable services that are used in constructors.
 * This causes runtime errors in NestJS because the dependency is undefined.
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../apps/api/src');

// Patterns that should use regular imports (not type imports)
const patterns = [
  /import type \{ ([^}]+Service[^}]*) \} from/g,
  /import type \{ (EventEmitter2[^}]*) \} from '@nestjs\/event-emitter'/g,
  /import type \{ (Reflector[^}]*) \} from '@nestjs\/core'/g,
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixed = content;
  
  for (const pattern of patterns) {
    // Reset lastIndex for each pattern
    pattern.lastIndex = 0;
    fixed = fixed.replace(pattern, 'import { $1 } from');
  }
  
  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed, 'utf-8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

function walkDir(dir) {
  let fixedCount = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

console.log('🔧 Fixing "import type" for injectable classes...\n');
const count = walkDir(srcDir);
console.log(`\n✨ Fixed ${count} files`);
