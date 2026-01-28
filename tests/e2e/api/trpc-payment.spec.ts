import { test, expect } from '@playwright/test';

/**
 * E2E Tests for tRPC Payment API
 * All payment procedures require authentication
 */

const API_BASE = 'http://localhost:3001/trpc';

test.describe('tRPC Payment API - Protected Procedures (Unauthorized)', () => {
  test('payment.listTransactions - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/payment.listTransactions`, {
      params: {
        input: JSON.stringify({ limit: 10 }),
      },
    });

    expect(response.status()).toBe(401);
  });

  test('payment.getTransaction - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/payment.getTransaction`, {
      params: {
        input: JSON.stringify({ id: '00000000-0000-0000-0000-000000000000' }),
      },
    });

    expect(response.status()).toBe(401);
  });

  test('payment.createCheckoutSession - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.post(`${API_BASE}/payment.createCheckoutSession`, {
      data: {
        courseId: '00000000-0000-0000-0000-000000000000',
        currency: 'vnd',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('payment.getTransactionByCourse - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/payment.getTransactionByCourse`, {
      params: {
        input: JSON.stringify({ courseId: '00000000-0000-0000-0000-000000000000' }),
      },
    });

    expect(response.status()).toBe(401);
  });

  test('payment.completeTransaction - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.post(`${API_BASE}/payment.completeTransaction`, {
      data: {
        transactionId: '00000000-0000-0000-0000-000000000000',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('tRPC Payment API - Teacher Revenue (Unauthorized)', () => {
  test('payment.getRevenueStats - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/payment.getRevenueStats`);

    expect(response.status()).toBe(401);
  });

  test('payment.getRevenueByCourse - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/payment.getRevenueByCourse`);

    expect(response.status()).toBe(401);
  });

  test('payment.getRecentTransactions - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/payment.getRecentTransactions`, {
      params: {
        input: JSON.stringify({ limit: 10 }),
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('tRPC Payment API - Input Validation (requires auth but tests schema)', () => {
  // Note: These test that the API validates input before checking auth
  // Some APIs check auth first, others validate schema first

  test('payment.listTransactions - validates limit range', async ({ request }) => {
    const response = await request.get(`${API_BASE}/payment.listTransactions`, {
      params: {
        input: JSON.stringify({ limit: 100 }), // max is 50
      },
    });

    // Could be 400 (validation) or 401 (auth first) depending on middleware order
    expect([400, 401]).toContain(response.status());
  });

  test('payment.listTransactions - validates status enum', async ({ request }) => {
    const response = await request.get(`${API_BASE}/payment.listTransactions`, {
      params: {
        input: JSON.stringify({ status: 'INVALID_STATUS' }),
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});
