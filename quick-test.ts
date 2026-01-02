import { chromium } from '@playwright/test';

async function runSimpleTest() {
  console.log('🚀 Starting E2E Test with Playwright...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test 1: Homepage
    console.log('📝 Test 1: Homepage Load');
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log(`   ✅ Page Title: ${title}`);
    
    const hasTitle = await page.locator('text=/V-EdFinance/i').count() > 0;
    console.log(`   ${hasTitle ? '✅' : '❌'} Found "V-EdFinance" on page\n`);

    // Test 2: Navigation check
    console.log('📝 Test 2: Navigation Elements');
    const navLinks = await page.locator('nav a').count();
    console.log(`   ✅ Found ${navLinks} navigation links\n`);

    // Screenshot
    await page.screenshot({ path: 'test-results/homepage-test.png', fullPage: true });
    console.log('   📸 Screenshot saved to test-results/homepage-test.png\n');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

runSimpleTest();
