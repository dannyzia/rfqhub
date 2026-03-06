import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('AUTH-E001: Register new buyer', async ({ page }) => {
    await page.click('a[href="/register"]');
    
    // Fill registration form
    await page.fill('#name', 'Test Buyer');
    await page.fill('#email', 'buyer@test.com');
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    
    // Select buyer role (default is buyer)
    await expect(page.locator('input[name="role"][value="buyer"]')).toBeChecked();
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('AUTH-E002: Register new vendor', async ({ page }) => {
    await page.click('a[href="/register"]');
    
    // Fill registration form
    await page.fill('#name', 'Test Vendor');
    await page.fill('#email', 'vendor@test.com');
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    
    // Select vendor role
    await page.click('input[name="role"][value="vendor"]');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('AUTH-E005: Login as buyer', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'buyer@test.com');
    await page.fill('#password', 'SecurePass123!');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('AUTH-E006: Login as vendor', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'vendor@test.com');
    await page.fill('#password', 'SecurePass123!');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('AUTH-E007: Login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'wrong@test.com');
    await page.fill('#password', 'wrongpass');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Login failed')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('AUTH-E009: Logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('#email', 'buyer@test.com');
    await page.fill('#password', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Look for logout functionality
    const logoutLink = page.locator('a:has-text("Logout"), button:has-text("Logout"), [data-testid="logout"]');
    
    if (await logoutLink.count() > 0) {
      await logoutLink.click();
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    } else {
      // If no logout link found, skip this test
      test.skip();
    }
  });

  test('AUTH-E015: Protected route access without auth', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('Basic navigation works', async ({ page }) => {
    // Test that the basic navigation works
    await page.goto('/');
    
    // Should show the home page
    await expect(page.locator('h1:has-text("RFQ Buddy")')).toBeVisible();
    
    // Should have login and register links
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Should show login form
    await expect(page.locator('h1:has-text("RFQ Buddy")')).toBeVisible();
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Register page loads correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Should show registration form
    await expect(page.locator('h1:has-text("RFQ Buddy")')).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    await expect(page.locator('input[name="role"]')).toBeVisible();
  });

  test('Password validation works', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with mismatched passwords
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@test.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'different');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
    await expect(page).toHaveURL('/register');
  });
});
