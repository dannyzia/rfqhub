import { test, expect } from '@playwright/test';

test.describe('Authentication UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Basic navigation works', async ({ page }) => {
    // Test that the basic navigation works
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
    
    // Should have register link
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('Register page loads correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Should show registration form
    await expect(page.locator('h1:has-text("RFQ Buddy")')).toBeVisible();
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('select#role')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Should have login link
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('Register form validation works', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with mismatched passwords
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@test.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'different');
    
    // Check that form accepts the input
    await expect(page.locator('#name')).toHaveValue('Test User');
    await expect(page.locator('#email')).toHaveValue('test@test.com');
    await expect(page.locator('#password')).toHaveValue('password123');
    await expect(page.locator('#confirmPassword')).toHaveValue('different');
    
    // Button should be disabled due to validation
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Role selection works', async ({ page }) => {
    await page.goto('/register');
    
    // Check default role
    await expect(page.locator('select#role')).toHaveValue('buyer');
    
    // Select vendor role
    await page.selectOption('select#role', 'vendor');
    await expect(page.locator('select#role')).toHaveValue('vendor');
    
    // Select buyer role again
    await page.selectOption('select#role', 'buyer');
    await expect(page.locator('select#role')).toHaveValue('buyer');
  });

  test('Form fields accept input', async ({ page }) => {
    await page.goto('/register');
    
    // Test all form fields
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john@example.com');
    await page.selectOption('select#role', 'vendor');
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    
    // Verify values were set
    await expect(page.locator('#name')).toHaveValue('John Doe');
    await expect(page.locator('#email')).toHaveValue('john@example.com');
    await expect(page.locator('select#role')).toHaveValue('vendor');
    await expect(page.locator('#password')).toHaveValue('SecurePass123!');
    await expect(page.locator('#confirmPassword')).toHaveValue('SecurePass123!');
  });

  test('Login form fields accept input', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    
    // Verify values were set
    await expect(page.locator('#email')).toHaveValue('test@example.com');
    await expect(page.locator('#password')).toHaveValue('password123');
  });

  test('Protected route redirects to login', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('Navigation between auth pages', async ({ page }) => {
    // Start at login
    await page.goto('/login');
    
    // Navigate to register
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL('/register');
    
    // Navigate back to login
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
  });

  test('Email field validation', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with invalid email
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    
    // Check that form accepts the input
    await expect(page.locator('#email')).toHaveValue('invalid-email');
    
    // Button should be disabled due to invalid email
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Required field indicators', async ({ page }) => {
    await page.goto('/register');
    
    // Check for required field indicators
    await expect(page.locator('label[for="name"].required')).toBeVisible();
    await expect(page.locator('label[for="email"].required')).toBeVisible();
    await expect(page.locator('label[for="role"].required')).toBeVisible();
    await expect(page.locator('label[for="password"].required')).toBeVisible();
    await expect(page.locator('label[for="confirmPassword"].required')).toBeVisible();
  });

  test('Password field types', async ({ page }) => {
    await page.goto('/register');
    
    // Verify password fields are of type password
    await expect(page.locator('input#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('input#confirmPassword')).toHaveAttribute('type', 'password');
    
    // Verify email field is of type email
    await expect(page.locator('input#email')).toHaveAttribute('type', 'email');
  });
});
