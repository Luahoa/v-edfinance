const fs = require('fs');
const path = require('path');

/**
 * Automated Test Migration Codemod (Dependency-Free)
 * Consolidates all tests to Vitest
 */

const projectRoot = process.cwd();

function getFiles(dir, files_ = []) {
    const files = fs.readdirSync(dir);
    for (const i in files) {
        const name = path.join(dir, files[i]);
        if (fs.statSync(name).isDirectory()) {
            if (!name.includes('node_modules') && !name.includes('dist') && !name.includes('.next') && !name.includes('.git')) {
                getFiles(name, files_);
            }
        } else {
            if (name.endsWith('.spec.ts') || name.endsWith('.test.ts') || name.endsWith('.spec.js')) {
                files_.push(name);
            }
        }
    }
    return files_;
}

const testFiles = getFiles(projectRoot);
console.log(`🚀 Scanning ${testFiles.length} test files...`);

let migratedCount = 0;

testFiles.forEach((filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Skip Playwright tests
    if (content.includes("@playwright/test")) {
        return;
    }

    // 1. Handle AVA tokens
    if (content.includes("from 'ava'") || content.includes('test(')) {
        if (content.includes("from 'ava'")) {
            console.log(`📦 Converting AVA file: ${path.relative(projectRoot, filePath)}`);
            content = content.replace(
                /import test from 'ava';/g,
                "import { describe, it, expect, beforeEach, vi } from 'vitest';"
            );
            changed = true;
        }

        // Assertions
        if (content.includes('t.is(') || content.includes('t.truthy(')) {
            content = content.replace(/t\.is\(([^,]+),\s*([^)]+)\)/g, 'expect($1).toBe($2)');
            content = content.replace(/t\.truthy\(([^)]+)\)/g, 'expect($1).toBeTruthy()');
            content = content.replace(/t\.falsy\(([^)]+)\)/g, 'expect($1).toBeFalsy()');
            content = content.replace(/t\.deepEqual\(([^,]+),\s*([^)]+)\)/g, 'expect($1).toEqual($2)');
            content = content.replace(/test\(/g, 'it(');
            changed = true;
        }
    }

    // 2. Handle Jest/Global tokens (describe, it, expect, jest)
    const hasJest = content.includes('jest.') || content.includes('jest.spyOn') || content.includes('jest.mock');
    const hasGlobals = content.includes('describe(') || content.includes('it(') || content.includes('expect(');

    if (hasJest || hasGlobals) {
        // Ensure Vitest import
        if (!content.includes("from 'vitest'")) {
            console.log(`📦 Adding Vitest imports: ${path.relative(projectRoot, filePath)}`);
            content = `import { describe, it, expect, beforeEach, vi } from 'vitest';\n${content}`;
            changed = true;
        }

        // Replace jest with vi even if vitest import existed but jest was still used (leftover)
        if (content.includes('jest.')) {
            console.log(`📦 Replacing leftover jest tokens: ${path.relative(projectRoot, filePath)}`);
            content = content.replace(/jest\.fn\(\)/g, 'vi.fn()');
            content = content.replace(/jest\.spyOn/g, 'vi.spyOn');
            content = content.replace(/jest\.mock/g, 'vi.mock');
            content = content.replace(/jest\.clearAllMocks\(\)/g, 'vi.clearAllMocks()');
            content = content.replace(/jest\.Mock/g, 'any');

            // Handle complex jest calls like jest.fn((cb) => ...)
            content = content.replace(/jest\.fn\(/g, 'vi.fn(');
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${path.relative(projectRoot, filePath)}`);
        migratedCount++;
    }
});

console.log(`\n🎉 Consolidation complete. Total files updated: ${migratedCount}`);
