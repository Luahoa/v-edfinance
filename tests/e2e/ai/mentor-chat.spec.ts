import { expect, test } from '@playwright/test';
import {
  assertUserIsLoggedIn,
  completeOnboarding,
  generateTestUser,
  registerUser,
} from '../../helpers/test-utils';

test.describe('AI Mentor: Chat Interaction Journey', () => {
  const locales = ['vi', 'en'];

  for (const locale of locales) {
    test(`[${locale}] Start new thread and send message to AI Mentor`, async ({ page }) => {
      const user = generateTestUser();

      // 1. Setup: Register and go to dashboard
      await registerUser(page, user, locale);
      if (page.url().includes('onboarding')) {
        await completeOnboarding(page);
      }
      await assertUserIsLoggedIn(page);

      // AI Mentor should be visible on dashboard (L129 of dashboard/page.tsx)
      const aiMentorSection = page.locator('text=AI Mentor').or(page.locator('text=Trợ lý AI'));
      await expect(aiMentorSection).toBeVisible();

      // 2. Create New Thread
      const startBtn = page.locator(
        'button:has-text("Bắt đầu thảo luận"), button:has-text("Start discussion")'
      );
      if (await startBtn.isVisible()) {
        await startBtn.click();
      } else {
        // Try sidebar new thread button if already in a thread
        await page.locator('button >> .lucide-message-square').click();
        await page.locator('button:has-text("Thread mới"), button:has-text("New Thread")').click();
      }

      // 3. Send Message
      const input = page.locator('input[placeholder*="Hỏi"], input[placeholder*="Ask"]');
      const testMessage = locale === 'vi' ? 'Tôi nên đầu tư vào đâu?' : 'Where should I invest?';

      await input.fill(testMessage);
      await page.locator('button >> .lucide-send').click();

      // 4. Verify AI Response
      // Wait for loader to disappear and message to appear
      await expect(page.locator('.lucide-loader-2')).not.toBeVisible({ timeout: 30000 });

      const messages = page.locator('.prose');
      await expect(messages.last()).toBeVisible();
      const responseText = await messages.last().innerText();
      expect(responseText.length).toBeGreaterThan(10);

      // 5. Verify Sidebar History
      await page.locator('button >> .lucide-message-square').click();
      const threadItem = page.locator('button p.font-medium').first();
      await expect(threadItem).toBeVisible();
    });
  }
});
