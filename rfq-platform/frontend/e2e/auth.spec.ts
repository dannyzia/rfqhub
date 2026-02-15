import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  // Auth setup is handled in auth.setup.ts
  // These basic tests just verify the setup worked

  test('should be able to access dashboard after auth setup', async ({ page }) => {
    await page.goto('/dashboard');
    // If auth failed, we'd be redirected to login
    const dashboardHeading = page.getByRole('heading', { name: /Dashboard/i });
    await expect(dashboardHeading).toBeVisible({ timeout: 10000 });
  });
});
