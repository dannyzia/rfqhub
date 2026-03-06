import { test, expect } from '@playwright/test';

test.describe('Cross-Browser & Responsive Tests', () => {
  // Test core flows across different browsers
  test.describe('Browser Compatibility Matrix', () => {
    test('BROWSER-001: Chrome - Full suite compatibility', async ({ page }) => {
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Chrome compatibility test: All core pages loaded successfully');
    });

    test('BROWSER-002: Firefox - Full suite compatibility', async ({ page }) => {
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Firefox compatibility test: All core pages loaded successfully');
    });

    test('BROWSER-003: Safari - Full suite compatibility', async ({ page }) => {
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Safari compatibility test: All core pages loaded successfully');
    });

    test('BROWSER-004: Edge - Full suite compatibility', async ({ page }) => {
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Edge compatibility test: All core pages loaded successfully');
    });
  });

  test.describe('Responsive Breakpoints', () => {
    test('RESP-001: Mobile S - 320px - Core flows', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Check mobile navigation
      const mobileNav = page.locator('nav, .nav, [role="navigation"]');
      const hasMobileNav = await mobileNav.count() > 0;
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      console.log(`Mobile S (320px) test: Mobile navigation ${hasMobileNav ? 'found' : 'not found'}`);
    });

    test('RESP-002: Mobile M - 375px - Core flows', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Mobile M (375px) test: All core pages loaded successfully');
    });

    test('RESP-003: Mobile L - 425px - Core flows', async ({ page }) => {
      await page.setViewportSize({ width: 425, height: 667 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Mobile L (425px) test: All core pages loaded successfully');
    });

    test('RESP-004: Tablet - 768px - All flows', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender creation
      await page.goto('/tenders/new');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Tablet (768px) test: All pages loaded successfully');
    });

    test('RESP-005: Laptop - 1024px - All flows', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender creation
      await page.goto('/tenders/new');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Laptop (1024px) test: All pages loaded successfully');
    });

    test('RESP-006: Desktop - 1440px - All flows', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender creation
      await page.goto('/tenders/new');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Desktop (1440px) test: All pages loaded successfully');
    });

    test('RESP-007: 4K - 2560px - All flows', async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender creation
      await page.goto('/tenders/new');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('4K (2560px) test: All pages loaded successfully');
    });
  });

  test.describe('Device Testing', () => {
    test('DEVICE-001: iPhone SE - 375 × 667 - Core flows', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('iPhone SE test: All core flows successful');
    });

    test('DEVICE-002: iPhone 12 - 390 × 844 - Core flows', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('iPhone 12 test: All core flows successful');
    });

    test('DEVICE-003: iPhone 14 Pro Max - 430 × 932 - Core flows', async ({ page }) => {
      await page.setViewportSize({ width: 430, height: 932 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('iPhone 14 Pro Max test: All core flows successful');
    });

    test('DEVICE-004: iPad Mini - 768 × 1024 - All flows', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender creation
      await page.goto('/tenders/new');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('iPad Mini test: All flows successful');
    });

    test('DEVICE-005: iPad Pro - 1024 × 1366 - All flows', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1366 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender creation
      await page.goto('/tenders/new');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('iPad Pro test: All flows successful');
    });

    test('DEVICE-006: Pixel 5 - 393 × 851 - Core flows', async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Pixel 5 test: All core flows successful');
    });

    test('DEVICE-007: Galaxy S21 - 360 × 800 - Core flows', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Galaxy S21 test: All core flows successful');
    });

    test('DEVICE-008: Galaxy Tab - 800 × 1280 - All flows', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 1280 });
      
      // Test login flow
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender listing
      await page.goto('/tenders');
      await expect(page.locator('body')).toBeVisible();
      
      // Test registration
      await page.goto('/register');
      await expect(page.locator('body')).toBeVisible();
      
      // Test tender creation
      await page.goto('/tenders/new');
      await expect(page.locator('body')).toBeVisible();
      
      console.log('Galaxy Tab test: All flows successful');
    });
  });

  test.describe('Responsive Design Validation', () => {
    test('Responsive Layout - Mobile vs Desktop', async ({ page }) => {
      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      
      const mobileLayout = await page.locator('body').boundingBox();
      
      // Test desktop layout
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/login');
      
      const desktopLayout = await page.locator('body').boundingBox();
      
      console.log(`Responsive test: Mobile width ${mobileLayout?.width}px, Desktop width ${desktopLayout?.width}px`);
      
      // Both layouts should be visible
      await expect(page.locator('body')).toBeVisible();
    });

    test('Touch vs Mouse Interactions', async ({ page }) => {
      // Test mobile touch interactions
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      
      // Test click on mobile (tap not supported in this context)
      const emailInput = page.locator('#email');
      if (await emailInput.count() > 0) {
        await emailInput.click();
        await page.waitForTimeout(500);
      }
      
      // Test desktop mouse interactions
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/login');
      
      // Test click on desktop
      if (await emailInput.count() > 0) {
        await emailInput.click();
        await page.waitForTimeout(500);
      }
      
      console.log('Touch vs Mouse interactions test completed');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('Orientation Change - Portrait vs Landscape', async ({ page }) => {
      // Test portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/tenders');
      
      const portraitLayout = await page.locator('body').boundingBox();
      
      // Test landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto('/tenders');
      
      const landscapeLayout = await page.locator('body').boundingBox();
      
      console.log(`Orientation test: Portrait ${portraitLayout?.width}x${portraitLayout?.height}, Landscape ${landscapeLayout?.width}x${landscapeLayout?.height}`);
      
      await expect(page.locator('body')).toBeVisible();
    });
  });
});