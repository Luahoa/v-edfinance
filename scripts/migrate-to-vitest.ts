import fs from 'node:fs';
import path from 'node:path';

const testFiles = [
  'apps/api/test/unit/analytics/analytics.service.spec.ts',
  'apps/api/test/unit/courses/courses.service.spec.ts',
  'apps/api/test/unit/users/users.service.spec.ts',
  'apps/api/test/unit/common/gamification.service.spec.ts',
  'apps/api/test/unit/ai/ai.service.spec.ts',
  'apps/api/test/unit/behavior/behavior.service.spec.ts',
  'apps/api/src/users/users.service.spec.ts',
  'apps/api/src/modules/analytics/simulation-bot.spec.ts',
  'apps/api/src/modules/analytics/predictive.service.spec.ts',
  'apps/api/src/modules/analytics/mentor.service.spec.ts',
  'apps/api/src/modules/analytics/analytics.service.spec.ts',
  'apps/api/src/modules/store/store.service.spec.ts',
  'apps/api/src/modules/nudge/nudge.service.spec.ts',
  'apps/api/src/modules/adaptive/adaptive.service.spec.ts',
  'apps/api/src/courses/courses.controller.spec.ts',
  'apps/api/src/checklists/checklists.service.spec.ts',
  'apps/api/src/common/i18n.service.spec.ts',
  'apps/api/src/common/gamification.service.spec.ts',
  'apps/api/src/common/gamification-pure.spec.ts',
  'apps/api/src/courses/courses.service.spec.ts',
  'apps/api/src/behavior/streak.service.spec.ts',
  'apps/api/src/app.controller.spec.ts',
  'apps/api/src/ai/ai.service.spec.ts',
  'apps/api/src/auth/auth.service.spec.ts',
  'apps/api/src/auth/auth.controller.spec.ts',
];

function migrateFile(filePath: string) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(absolutePath, 'utf8');

  // Add vitest imports if missing
  if (!content.includes("from 'vitest'")) {
    content = `import { describe, it, expect, beforeEach, vi } from 'vitest';\n${content}`;
  }

  // Replace Jest patterns
  content = content.replace(/jest\.fn\(\)/g, 'vi.fn()');
  content = content.replace(/jest\.spyOn/g, 'vi.spyOn');
  content = content.replace(/jest\.mock/g, 'vi.mock');
  content = content.replace(/jest\.clearAllMocks\(\)/g, 'vi.clearAllMocks()');
  content = content.replace(/jest\.resetAllMocks\(\)/g, 'vi.resetAllMocks()');
  content = content.replace(/jest\.restoreAllMocks\(\)/g, 'vi.restoreAllMocks()');

  // Replace AVA patterns (if any)
  content = content.replace(/t\.is\(/g, 'expect(');
  content = content.replace(/t\.truthy\(/g, 'expect(');
  content = content.replace(/t\.falsy\(/g, 'expect(');
  content = content.replace(/t\.deepEqual\(/g, 'expect(');

  // Note: Manual adjustment might still be needed for AVA's complex matchers

  fs.writeFileSync(absolutePath, content);
  console.log(`Migrated: ${filePath}`);
}

testFiles.forEach(migrateFile);
