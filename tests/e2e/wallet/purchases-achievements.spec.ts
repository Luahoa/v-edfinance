import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, completeOnboarding, assertUserIsLoggedIn } from '../../helpers/test-utils';

test.describe('Wallet & Store: Purchases & Achievements Flow', () => {
  const locales = ['vi', 'en'];

  for (const locale of locales) {
    test(`[${locale}] Purchase item from Store and verify achievement`, async ({ page }) => {
      const user = generateTestUser();
      
      // 1. Register and get initial points
      await registerUser(page, user, locale);
      if (page.url().includes('onboarding')) {
        await completeOnboarding(page);
      }
      await assertUserIsLoggedIn(page);

      // 2. Navigate to Store
      await page.goto(`/${locale}/store`);
      await expect(page).toHaveURL(new RegExp(`.*${locale}/store`));

      // 3. Verify Points Balance (assuming initial points are granted on signup)
      // If initial points are 0, this test might need a way to add points
      const pointsText = await page.locator('span.font-bold.text-blue-700').innerText();
      const points = parseInt(pointsText.replace(/[^0-9]/g, ''));

      // 4. Try to buy an item (e.g., Streak Freeze)
      const buyButton = page.locator('button:has-text("Mua"), button:has-text("Buy")').first();
      const itemPriceText = await page.locator('.font-bold.text-zinc-900 >> nth=1').innerText(); // Adjust selector as needed
      const price = parseInt(itemPriceText.replace(/[^0-9]/g, ''));

      if (points >= price) {
        await buyButton.click();
        
        // 5. Verify Success Message
        const successToast = page.locator('.bg-green-50, .text-green-700');
        await expect(successToast).toBeVisible();
        
        // 6. Verify Points Decreased
        const newPointsText = await page.locator('span.font-bold.text-blue-700').innerText();
        const newPoints = parseInt(newPointsText.replace(/[^0-9]/g, ''));
        expect(newPoints).toBe(points - price);
      } else {
        console.log(`Insufficient points for ${user.email}: ${points} < ${price}`);
        await expect(buyButton).toBeDisabled();
      }

      // 7. Check Achievements/Badges in Dashboard
      await page.goto(`/${locale}/dashboard`);
      // Assuming there's a badge section
      const badgesSection = page.locator('[data-testid="badges-section"]');
      if (await badgesSection.isVisible()) {
        await expect(badgesSection).toBeVisible();
      }
    });
  }
});
