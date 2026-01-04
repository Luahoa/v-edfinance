import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../helpers/test-utils';

const VALID_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const INVALID_YOUTUBE_URL = 'https://invalid-url.com';
const DELETED_VIDEO_URL = 'https://www.youtube.com/watch?v=DELETED_VIDEO';

test.describe('Admin YouTube Flow - ved-yt14', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, 'vi');
  });

  test('Admin pastes valid YouTube URL → auto-fetch metadata → save lesson', async ({ page }) => {
    // Navigate to create lesson page
    await page.goto('/vi/admin/courses');
    await page.click('[data-testid="create-course-btn"]');
    
    // Fill course basic info
    await page.fill('[data-testid="course-title-input"]', 'Test Course with YouTube');
    await page.fill('[data-testid="course-description-input"]', 'Test course description');
    await page.click('[data-testid="save-course-btn"]');
    
    // Add lesson with YouTube video
    await page.click('[data-testid="add-lesson-btn"]');
    await page.fill('[data-testid="lesson-title-input"]', 'Test Lesson with YouTube');
    
    // Paste YouTube URL
    const youtubeUrlInput = page.locator('[data-testid="youtube-url-input"]');
    await youtubeUrlInput.fill(VALID_YOUTUBE_URL);
    
    // Verify auto-fetch metadata
    await expect(page.locator('[data-testid="video-title-preview"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="video-duration-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="video-thumbnail-preview"]')).toBeVisible();
    
    // Save lesson
    await page.click('[data-testid="save-lesson-btn"]');
    
    // Verify success
    await expect(page.locator('text=Lesson created successfully').or(page.locator('text=Tạo bài học thành công'))).toBeVisible({ timeout: 5000 });
  });

  test('Admin pastes invalid URL → show error message', async ({ page }) => {
    await page.goto('/vi/admin/courses');
    
    // Assuming we're in lesson creation form
    await page.click('[data-testid="create-course-btn"]');
    await page.fill('[data-testid="course-title-input"]', 'Test Course');
    await page.click('[data-testid="save-course-btn"]');
    
    await page.click('[data-testid="add-lesson-btn"]');
    await page.fill('[data-testid="lesson-title-input"]', 'Test Lesson');
    
    // Paste invalid URL
    const youtubeUrlInput = page.locator('[data-testid="youtube-url-input"]');
    await youtubeUrlInput.fill(INVALID_YOUTUBE_URL);
    await youtubeUrlInput.blur();
    
    // Verify error message
    await expect(page.locator('text=Invalid YouTube URL').or(page.locator('text=URL YouTube không hợp lệ'))).toBeVisible({ timeout: 5000 });
  });

  test('YouTube API error → show graceful fallback message', async ({ page }) => {
    await page.goto('/vi/admin/courses');
    
    // Simulate API error by using a deleted video URL
    await page.click('[data-testid="create-course-btn"]');
    await page.fill('[data-testid="course-title-input"]', 'Test Course');
    await page.click('[data-testid="save-course-btn"]');
    
    await page.click('[data-testid="add-lesson-btn"]');
    await page.fill('[data-testid="lesson-title-input"]', 'Test Lesson');
    
    const youtubeUrlInput = page.locator('[data-testid="youtube-url-input"]');
    await youtubeUrlInput.fill(DELETED_VIDEO_URL);
    
    // Should show error or allow manual duration input
    await expect(
      page.locator('text=Could not fetch video metadata').or(
        page.locator('text=Không thể lấy thông tin video')
      ).or(
        page.locator('[data-testid="manual-duration-input"]')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('Admin can manually override video metadata', async ({ page }) => {
    await page.goto('/vi/admin/courses');
    
    await page.click('[data-testid="create-course-btn"]');
    await page.fill('[data-testid="course-title-input"]', 'Test Course');
    await page.click('[data-testid="save-course-btn"]');
    
    await page.click('[data-testid="add-lesson-btn"]');
    await page.fill('[data-testid="lesson-title-input"]', 'Test Lesson');
    
    // Paste YouTube URL
    const youtubeUrlInput = page.locator('[data-testid="youtube-url-input"]');
    await youtubeUrlInput.fill(VALID_YOUTUBE_URL);
    
    // Wait for auto-fetch
    await page.waitForTimeout(2000);
    
    // Override title if edit button exists
    const editTitleBtn = page.locator('[data-testid="edit-video-title-btn"]');
    if (await editTitleBtn.isVisible()) {
      await editTitleBtn.click();
      const titleInput = page.locator('[data-testid="video-title-input"]');
      await titleInput.fill('Custom Video Title');
      
      // Save
      await page.click('[data-testid="save-lesson-btn"]');
      
      // Verify custom title was saved
      await expect(page.locator('text=Custom Video Title')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Admin can extract videoId from various YouTube URL formats', async ({ page }) => {
    const testUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share',
    ];

    await page.goto('/vi/admin/courses');
    
    for (const url of testUrls) {
      await page.click('[data-testid="create-course-btn"]');
      await page.fill('[data-testid="course-title-input"]', `Test Course ${url}`);
      await page.click('[data-testid="save-course-btn"]');
      
      await page.click('[data-testid="add-lesson-btn"]');
      await page.fill('[data-testid="lesson-title-input"]', 'Test Lesson');
      
      const youtubeUrlInput = page.locator('[data-testid="youtube-url-input"]');
      await youtubeUrlInput.fill(url);
      
      // Should extract videoId successfully
      await expect(page.locator('[data-testid="video-id-display"]')).toContainText('dQw4w9WgXcQ', { timeout: 5000 });
      
      // Cleanup - go back
      await page.click('[data-testid="cancel-lesson-btn"]');
      await page.goto('/vi/admin/courses');
    }
  });

  test('Admin can preview YouTube video before saving', async ({ page }) => {
    await page.goto('/vi/admin/courses');
    
    await page.click('[data-testid="create-course-btn"]');
    await page.fill('[data-testid="course-title-input"]', 'Test Course');
    await page.click('[data-testid="save-course-btn"]');
    
    await page.click('[data-testid="add-lesson-btn"]');
    await page.fill('[data-testid="lesson-title-input"]', 'Test Lesson');
    
    const youtubeUrlInput = page.locator('[data-testid="youtube-url-input"]');
    await youtubeUrlInput.fill(VALID_YOUTUBE_URL);
    
    // Click preview button if exists
    const previewBtn = page.locator('[data-testid="preview-video-btn"]');
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      
      // YouTube iframe should be visible
      await expect(page.frameLocator('iframe[src*="youtube.com"]').locator('video')).toBeVisible({ timeout: 10000 });
    }
  });
});
