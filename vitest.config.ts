import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: [path.resolve(__dirname, './tests/setup.ts')],
        include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)', '**/*.e2e-spec.ts'],
        exclude: [
            '**/node_modules/**',
            'tests/**',
            '**/dist/**',
            '**/.next/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.spec.ts',
                '**/*.test.ts',
                '**/dist/',
                '**/.next/',
            ],
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80,
        },
        // Enable UI mode for better DX
        ui: true,
        // Run tests in parallel for speed
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
            },
        },
        // Timeout for tests (increase if needed for E2B tests)
        testTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './apps/api/src'),
            '@web': path.resolve(__dirname, './apps/web/src'),
        },
    },
});
