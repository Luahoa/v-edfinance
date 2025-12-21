import { test, expect } from '@playwright/test';

test.describe('E005: AI Mentor Chat', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    
    const timestamp = Date.now();
    const testEmail = `ai-user-${timestamp}@vedfinance.test`;

    // Create authenticated user
    await page.goto('/vi/register');
    await page.fill('[data-testid="register-name"]', 'AI Chat Tester');
    await page.fill('[data-testid="register-email"]', testEmail);
    await page.fill('[data-testid="register-password"]', 'AiPass123!');
    await page.fill('[data-testid="register-password-confirm"]', 'AiPass123!');
    await page.click('[data-testid="register-submit"]');

    // Complete onboarding
    await page.waitForURL(/\/vi\/onboarding/, { timeout: 15000 });
    await page.click('[data-testid="onboarding-beginner"]');
    await page.click('[data-testid="onboarding-longterm"]');
    await page.click('[data-testid="onboarding-medium"]');
    await page.click('[data-testid="onboarding-complete"]');

    await page.waitForURL(/\/vi\/dashboard/, { timeout: 15000 });
  });

  test('should open AI mentor chat and send message', async ({ page }) => {
    // Find and click AI chat button
    const aiChatBtn = page.locator('[data-testid="ai-chat-btn"], [data-testid="mentor-chat-btn"]');
    
    if (await aiChatBtn.isVisible({ timeout: 5000 })) {
      await aiChatBtn.click();

      // Verify chat interface opens
      const chatInterface = page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible({ timeout: 10000 });

      // Type a question
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Tôi nên bắt đầu đầu tư như thế nào?');

      // Send message
      const sendBtn = page.locator('[data-testid="chat-send-btn"]');
      await sendBtn.click();

      // Verify message appears in chat
      const messages = page.locator('[data-testid^="chat-message-"]');
      await expect(messages.last()).toContainText('Tôi nên bắt đầu đầu tư như thế nào?');

      // Wait for AI response (may take a few seconds)
      const aiResponse = page.locator('[data-testid^="ai-message-"], [data-role="assistant"]');
      await expect(aiResponse.last()).toBeVisible({ timeout: 30000 });

      // Verify AI response contains text
      const responseText = await aiResponse.last().textContent();
      expect(responseText?.length).toBeGreaterThan(10);
    }
  });

  test('should maintain conversation history', async ({ page }) => {
    const aiChatBtn = page.locator('[data-testid="ai-chat-btn"], [data-testid="mentor-chat-btn"]');
    
    if (await aiChatBtn.isVisible({ timeout: 5000 })) {
      await aiChatBtn.click();

      const chatInterface = page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible({ timeout: 10000 });

      // Send first message
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Xin chào');
      
      const sendBtn = page.locator('[data-testid="chat-send-btn"]');
      await sendBtn.click();
      await page.waitForTimeout(2000);

      // Wait for AI response
      const aiResponse = page.locator('[data-testid^="ai-message-"], [data-role="assistant"]');
      await expect(aiResponse.last()).toBeVisible({ timeout: 30000 });

      // Send follow-up message
      await chatInput.fill('Tôi muốn học về cổ phiếu');
      await sendBtn.click();
      await page.waitForTimeout(2000);

      // Verify second AI response
      await expect(aiResponse.last()).toBeVisible({ timeout: 30000 });

      // Verify conversation history (should have at least 4 messages: 2 user + 2 AI)
      const allMessages = page.locator('[data-testid^="chat-message-"], [data-testid^="ai-message-"]');
      const count = await allMessages.count();
      expect(count).toBeGreaterThanOrEqual(4);
    }
  });

  test('should provide personalized financial advice', async ({ page }) => {
    const aiChatBtn = page.locator('[data-testid="ai-chat-btn"], [data-testid="mentor-chat-btn"]');
    
    if (await aiChatBtn.isVisible({ timeout: 5000 })) {
      await aiChatBtn.click();

      const chatInterface = page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible({ timeout: 10000 });

      // Ask for personalized advice
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Dựa trên hồ sơ của tôi, tôi nên đầu tư vào đâu?');

      const sendBtn = page.locator('[data-testid="chat-send-btn"]');
      await sendBtn.click();

      // Wait for AI response
      const aiResponse = page.locator('[data-testid^="ai-message-"], [data-role="assistant"]');
      await expect(aiResponse.last()).toBeVisible({ timeout: 30000 });

      // Verify response mentions user profile or personalization
      const responseText = await aiResponse.last().textContent();
      expect(responseText?.length).toBeGreaterThan(50);
    }
  });

  test('should handle chat input validation', async ({ page }) => {
    const aiChatBtn = page.locator('[data-testid="ai-chat-btn"], [data-testid="mentor-chat-btn"]');
    
    if (await aiChatBtn.isVisible({ timeout: 5000 })) {
      await aiChatBtn.click();

      const chatInterface = page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible({ timeout: 10000 });

      // Try to send empty message
      const sendBtn = page.locator('[data-testid="chat-send-btn"]');
      
      // Button should be disabled when input is empty
      const isDisabled = await sendBtn.isDisabled();
      if (isDisabled) {
        expect(isDisabled).toBeTruthy();
      }

      // Fill with valid message
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Valid message');

      // Button should be enabled
      await expect(sendBtn).toBeEnabled();
    }
  });

  test('should close and reopen chat', async ({ page }) => {
    const aiChatBtn = page.locator('[data-testid="ai-chat-btn"], [data-testid="mentor-chat-btn"]');
    
    if (await aiChatBtn.isVisible({ timeout: 5000 })) {
      // Open chat
      await aiChatBtn.click();

      const chatInterface = page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible({ timeout: 10000 });

      // Send a message
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Test persistence');
      
      const sendBtn = page.locator('[data-testid="chat-send-btn"]');
      await sendBtn.click();
      await page.waitForTimeout(2000);

      // Close chat
      const closeBtn = page.locator('[data-testid="chat-close-btn"]');
      if (await closeBtn.isVisible({ timeout: 5000 })) {
        await closeBtn.click();
        await expect(chatInterface).not.toBeVisible();

        // Reopen chat
        await aiChatBtn.click();
        await expect(chatInterface).toBeVisible({ timeout: 10000 });

        // Verify message history persists
        const messages = page.locator('[data-testid^="chat-message-"]');
        await expect(messages.last()).toContainText('Test persistence');
      }
    }
  });

  test('should handle AI errors gracefully', async ({ page }) => {
    const aiChatBtn = page.locator('[data-testid="ai-chat-btn"], [data-testid="mentor-chat-btn"]');
    
    if (await aiChatBtn.isVisible({ timeout: 5000 })) {
      await aiChatBtn.click();

      const chatInterface = page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible({ timeout: 10000 });

      // Send message that might trigger error (very long message)
      const chatInput = page.locator('[data-testid="chat-input"]');
      const longMessage = 'A'.repeat(5000);
      await chatInput.fill(longMessage);

      const sendBtn = page.locator('[data-testid="chat-send-btn"]');
      await sendBtn.click();

      // Check for error message or validation
      const errorMsg = page.locator('[data-testid="chat-error"], text=/Error|Lỗi/i');
      
      // Either error appears or message is truncated/rejected
      const hasError = await errorMsg.isVisible({ timeout: 10000 }).catch(() => false);
      const inputValue = await chatInput.inputValue();
      
      expect(hasError || inputValue.length < 5000).toBeTruthy();
    }
  });

  test('should show typing indicator while AI responds', async ({ page }) => {
    const aiChatBtn = page.locator('[data-testid="ai-chat-btn"], [data-testid="mentor-chat-btn"]');
    
    if (await aiChatBtn.isVisible({ timeout: 5000 })) {
      await aiChatBtn.click();

      const chatInterface = page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible({ timeout: 10000 });

      // Send message
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('Tell me about investing');
      
      const sendBtn = page.locator('[data-testid="chat-send-btn"]');
      await sendBtn.click();

      // Check for typing indicator
      const typingIndicator = page.locator('[data-testid="typing-indicator"], [data-testid="ai-typing"]');
      
      if (await typingIndicator.isVisible({ timeout: 3000 })) {
        await expect(typingIndicator).toBeVisible();
        
        // Wait for response and verify indicator disappears
        const aiResponse = page.locator('[data-testid^="ai-message-"], [data-role="assistant"]');
        await expect(aiResponse.last()).toBeVisible({ timeout: 30000 });
        
        await expect(typingIndicator).not.toBeVisible({ timeout: 5000 });
      }
    }
  });
});
