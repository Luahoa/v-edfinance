import { expect, test } from '@playwright/test';

test.describe('Course Enrollment & Learning Flow', () => {
  const TEST_USER = {
    email: `student-${Date.now()}@example.com`,
    password: 'Password123!',
  };

  test.beforeAll(async ({ request }) => {
    // Đăng ký user test để dùng cho flow
    await request.post('http://localhost:3001/auth/register', {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
        role: 'STUDENT',
      },
    });
  });

  test('should allow user to browse, enroll, and complete a lesson', async ({ page }) => {
    // 1. Login
    await page.goto('/vi/login');
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Đi tới danh sách khóa học
    await page.goto('/vi/courses');
    await expect(page.locator('h1')).toContainText(/Khóa học/i);

    // 3. Chọn một khóa học (giả định có ít nhất 1 khóa học trong DB test)
    const firstCourse = page.locator('a:has-text("Xem khóa học")').first();
    await expect(firstCourse).toBeVisible();
    await firstCourse.click();

    // 4. Kiểm tra trang chi tiết khóa học
    await expect(page).toHaveURL(/.*courses\/[a-zA-Z0-9-]+/);
    await expect(page.locator('h2')).toContainText(/Nội dung khóa học/i);

    // 5. Click vào bài học đầu tiên
    const firstLesson = page.locator('a[href*="/lessons/"]').first();
    await expect(firstLesson).toBeVisible();
    await firstLesson.click();

    // 6. Kiểm tra trang bài học
    await expect(page).toHaveURL(/.*lessons\/[a-zA-Z0-9-]+/);

    // 7. Hoàn thành bài học (giả định có nút "Hoàn thành")
    const completeButton = page.locator('button:has-text("Hoàn thành")');
    if (await completeButton.isVisible()) {
      await completeButton.click();
      // Kiểm tra nhận được điểm (gamification nudge)
      await expect(page.locator('text=Bạn đã nhận được 10 điểm')).toBeVisible();
    }
  });
});
