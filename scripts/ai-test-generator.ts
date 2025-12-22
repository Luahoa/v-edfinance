/**
 * V-EdFinance AI Test Generator
 * Fully automated test generation using command-suite + Swarm + Amp
 * 
 * Usage: pnpm ts-node scripts/ai-test-generator.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

const execAsync = promisify(exec);

interface TestTask {
  sourceFile: string;
  testFile: string;
  coverage: number;
  priority: 'P0' | 'P1' | 'P2';
  exists: boolean;
}

class AITestGenerator {
  private async scanCodebase(): Promise<TestTask[]> {
    console.log('🔍 Scanning codebase for test coverage gaps...\n');
    
    // Find all source files
    const serviceFiles = await glob('apps/api/src/**/*.service.ts', { 
      ignore: ['**/*.spec.ts', '**/node_modules/**'] 
    });
    
    const controllerFiles = await glob('apps/api/src/**/*.controller.ts', {
      ignore: ['**/*.spec.ts', '**/node_modules/**']
    });
    
    const allFiles = [...serviceFiles, ...controllerFiles];
    const tasks: TestTask[] = [];
    
    for (const sourceFile of allFiles) {
      const testFile = sourceFile.replace(/\.ts$/, '.spec.ts');
      const exists = await this.fileExists(testFile);
      const coverage = exists ? await this.getFileCoverage(sourceFile) : 0;
      const priority = this.getPriority(sourceFile);
      
      if (!exists || coverage < 80) {
        tasks.push({
          sourceFile,
          testFile,
          coverage,
          priority,
          exists,
        });
      }
    }
    
    return tasks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority.localeCompare(b.priority);
      }
      return a.coverage - b.coverage;
    });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async getFileCoverage(sourceFile: string): Promise<number> {
    try {
      const coveragePath = 'apps/api/coverage/coverage-final.json';
      const coverageData = await fs.readFile(coveragePath, 'utf-8');
      const coverage = JSON.parse(coverageData);
      
      if (coverage[sourceFile]) {
        const { lines } = coverage[sourceFile];
        return (lines.covered / lines.total) * 100;
      }
    } catch (error) {
      // Coverage file not found, run tests first
    }
    return 0;
  }

  private getPriority(filePath: string): 'P0' | 'P1' | 'P2' {
    if (filePath.includes('/auth/')) return 'P0';
    if (filePath.includes('/payment/')) return 'P0';
    if (filePath.includes('/users/')) return 'P1';
    if (filePath.includes('/courses/')) return 'P1';
    if (filePath.includes('/ai/')) return 'P1';
    return 'P2';
  }

  private async generateTest(task: TestTask): Promise<void> {
    const fileName = path.basename(task.sourceFile);
    const status = task.exists ? `Enhance (${task.coverage.toFixed(1)}%)` : 'Create';
    
    console.log(`📝 ${status}: ${fileName}`);
    
    // Read source file
    const sourceCode = await fs.readFile(task.sourceFile, 'utf-8');
    
    // Build comprehensive prompt
    const prompt = `
Generate comprehensive Vitest tests for ${fileName}:

Source File: ${task.sourceFile}
Current Coverage: ${task.coverage.toFixed(1)}%
Target Coverage: 80%+
Priority: ${task.priority}

Source Code:
\`\`\`typescript
${sourceCode}
\`\`\`

Requirements:
1. Use Vitest testing framework (NOT Jest)
2. Mock all dependencies:
   - PrismaService (use { provide: PrismaService, useValue: mockPrisma })
   - External APIs (Gemini, S3, etc.)
3. Test JSONB fields:
   - Validate structure (title, description, metadata)
   - Test multi-locale support (vi/en/zh)
4. Follow AAA pattern (Arrange-Act-Assert)
5. Include edge cases:
   - NotFoundException (entity not found)
   - BadRequestException (invalid input)
   - Validation errors (class-validator DTOs)
6. Use test helpers from apps/api/src/test-utils/

Test File Structure:
\`\`\`typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
// Import service and dependencies
// Create mocks
// Write tests
\`\`\`

Output: Write complete test file to ${task.testFile}
`;

    // Save prompt to temp file for Amp
    const promptFile = `temp-prompt-${Date.now()}.txt`;
    await fs.writeFile(promptFile, prompt);
    
    try {
      // Use Amp to generate test
      console.log('   🤖 Invoking AI agent...');
      
      // Simulate Amp execution (replace with actual Amp CLI call)
      // await execAsync(`amp execute "$(cat ${promptFile})"`);
      
      // For now, log the prompt and create a TODO marker
      console.log(`   ⏳ TODO: Generate test for ${fileName}`);
      
      // Clean up
      await fs.unlink(promptFile);
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      await fs.unlink(promptFile).catch(() => {});
    }
  }

  async run(): Promise<void> {
    console.log('🚀 V-EdFinance AI Test Generator\n');
    console.log('=' . repeat(50) + '\n');
    
    // Step 1: Scan codebase
    const tasks = await this.scanCodebase();
    
    console.log(`📊 Analysis Results:`);
    console.log(`   Total files scanned: ${tasks.length}`);
    console.log(`   🔴 P0 (Critical): ${tasks.filter(t => t.priority === 'P0').length}`);
    console.log(`   🟡 P1 (High): ${tasks.filter(t => t.priority === 'P1').length}`);
    console.log(`   🟢 P2 (Medium): ${tasks.filter(t => t.priority === 'P2').length}`);
    console.log(`\n`);
    
    // Step 2: Generate tests (P0 first)
    const p0Tasks = tasks.filter(t => t.priority === 'P0');
    const p1Tasks = tasks.filter(t => t.priority === 'P1');
    const p2Tasks = tasks.filter(t => t.priority === 'P2');
    
    if (p0Tasks.length > 0) {
      console.log('🔴 Processing P0 (Critical) Files:\n');
      for (const task of p0Tasks) {
        await this.generateTest(task);
      }
      console.log('');
    }
    
    if (p1Tasks.length > 0) {
      console.log('🟡 Processing P1 (High Priority) Files:\n');
      for (const task of p1Tasks.slice(0, 10)) { // Limit to 10
        await this.generateTest(task);
      }
      console.log('');
    }
    
    if (p2Tasks.length > 0 && p0Tasks.length === 0 && p1Tasks.length === 0) {
      console.log('🟢 Processing P2 (Medium Priority) Files:\n');
      for (const task of p2Tasks.slice(0, 5)) { // Limit to 5
        await this.generateTest(task);
      }
      console.log('');
    }
    
    console.log('=' . repeat(50));
    console.log('✅ AI Test Generator Complete!\n');
    console.log('📊 Next Steps:');
    console.log('   1. Review generated tests');
    console.log('   2. Run: pnpm --filter api test');
    console.log('   3. Check coverage: pnpm --filter api test:cov\n');
  }
}

// Execute
const generator = new AITestGenerator();
generator.run().catch(console.error);
