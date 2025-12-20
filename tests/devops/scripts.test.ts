import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPTS_DIR = join(process.cwd(), 'scripts');

describe('DevOps Scripts', () => {
  it('should have all critical scripts', () => {
    const scripts: string[] = ['verify-all.sh', 'run-all-tests.sh', 'e2b-e2e-orchestrator.js'];

    for (const script of scripts) {
      const path = join(SCRIPTS_DIR, script);
      expect(existsSync(path)).toBe(true);
    }
  });

  it('should have all infrastructure directories', () => {
    const dirs: string[] = ['apps/api', 'apps/web', 'apps/api/prisma', 'monitoring'];

    for (const dir of dirs) {
      const path = join(process.cwd(), dir);
      expect(existsSync(path)).toBe(true);
    }
  });

  it('should have monitoring configuration files', () => {
    const files: string[] = ['docker-compose.monitoring.yml', 'docker-compose.yml'];

    for (const file of files) {
      const path = join(process.cwd(), file);
      expect(existsSync(path)).toBe(true);
    }
  });
});
