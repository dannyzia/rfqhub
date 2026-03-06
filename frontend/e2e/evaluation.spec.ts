import { test, expect } from '@playwright/test';

test.describe('Evaluation UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock authentication for evaluator
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-evaluator-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('userRole', 'evaluator');
      localStorage.setItem('userEmail', 'evaluator@test.com');
    });
  });

  test('Can access evaluator dashboard', async ({ page }) => {
    await page.goto('/evaluator/dashboard');
    
    // Should show page content
    await expect(page.locator('body')).toBeVisible();
    
    // Should not redirect to login (auth working)
    await expect(page).not.toHaveURL('/login');
  });

  test('Can access evaluation page for specific tender', async ({ page }) => {
    await page.goto('/evaluator/evaluate/1/assignment-1');
    
    // Should show page content
    await expect(page.locator('body')).toBeVisible();
    
    // Should not redirect to login (auth working)
    await expect(page).not.toHaveURL('/login');
  });

  test('Protected routes work', async ({ page }) => {
    // Test without authentication
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    await page.goto('/evaluator/dashboard');
    // Should redirect to login when not authenticated
    await expect(page).toHaveURL('/login');
  });

  test('Authentication state persists', async ({ page }) => {
    // Set up authentication
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-evaluator-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('userRole', 'evaluator');
      localStorage.setItem('userEmail', 'evaluator@test.com');
    });
    
    // Navigate to evaluator dashboard
    await page.goto('/evaluator/dashboard');
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).not.toHaveURL('/login');
  });

  test('Role-based routing works', async ({ page }) => {
    // Set up evaluator authentication
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-evaluator-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('userRole', 'evaluator');
      localStorage.setItem('userEmail', 'evaluator@test.com');
    });
    
    // Test evaluator routes
    await page.goto('/evaluator/dashboard');
    await expect(page).toHaveURL('/evaluator/dashboard');
    
    await page.goto('/evaluator/evaluate/1/assignment-1');
    await expect(page).toHaveURL('/evaluator/evaluate/1/assignment-1');
  });
});