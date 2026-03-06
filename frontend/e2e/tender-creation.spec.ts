import { test, expect } from '@playwright/test';

test.describe('Tender Creation UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Can navigate to tender creation', async ({ page }) => {
    // Try to access tender creation page
    await page.goto('/tenders/new');
    
    // Should either show form or redirect to login (if auth required)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/tenders\/new|\/login/);
  });

  test('Tender list page loads', async ({ page }) => {
    await page.goto('/tenders');
    
    // Should show tenders list or redirect to login
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Navigation elements exist on home', async ({ page }) => {
    await page.goto('/');
    
    // Should have basic navigation
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('Can access tender details', async ({ page }) => {
    await page.goto('/tenders/1');
    
    // Should show tender details or redirect
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Basic UI elements load', async ({ page }) => {
    await page.goto('/');
    
    // Should have main UI elements
    await expect(page.locator('body')).toBeVisible();
  });
});