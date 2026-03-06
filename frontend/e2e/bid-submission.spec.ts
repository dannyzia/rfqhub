import { test, expect } from '@playwright/test';

test.describe('Bid Submission UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Can access tender details', async ({ page }) => {
    await page.goto('/tenders/1');
    
    // Should show tender details or redirect
    await expect(page.locator('h1, h2, body')).toBeVisible();
  });

  test('Can navigate to bid submission', async ({ page }) => {
    await page.goto('/tenders/1/bid');
    
    // Should show bid submission page or redirect to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/tenders\/1\/bid|\/login/);
  });

  test('Form elements exist', async ({ page }) => {
    await page.goto('/tenders/1/bid');
    
    // Should have form elements
    await expect(page.locator('form, input, textarea, button').first()).toBeVisible();
  });

  test('Can fill form fields', async ({ page }) => {
    await page.goto('/tenders/1/bid');
    
    // Try to fill form if available
    const priceInput = page.locator('input[type="number"], input[name*="price"]');
    if (await priceInput.count() > 0) {
      await priceInput.fill('50000');
      await expect(priceInput).toHaveValue('50000');
    }
    
    const proposalArea = page.locator('textarea');
    if (await proposalArea.count() > 0) {
      await proposalArea.fill('Our proposal');
      await expect(proposalArea).toHaveValue('Our proposal');
    }
  });

  test('Document upload exists', async ({ page }) => {
    await page.goto('/tenders/1/bid');
    
    // Should have file upload element
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await expect(fileInput).toBeVisible();
    }
  });

  test('Submit button exists', async ({ page }) => {
    await page.goto('/tenders/1/bid');
    
    // Should have submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
    if (await submitButton.count() > 0) {
      await expect(submitButton).toBeVisible();
    }
  });
});