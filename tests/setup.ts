// Vitest global setup file
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Setup MSW (Mock Service Worker)
beforeAll(() => {
    // Start MSW server
    console.log('🔧 Vitest setup: Starting MSW mock server...');
});

afterEach(() => {
    // Reset handlers between tests
    console.log('🧹 Cleaning up after test...');
});

afterAll(() => {
    // Cleanup
    console.log('✅ Vitest teardown complete');
});

// Suppress console warnings in tests (optional)
global.console = {
    ...console,
    warn: vi.fn(),
    error: console.error, // Keep errors visible
};
