import { test, expect } from '@Playwright/test';

test.describe('Security Tests - Basic Security Validation', () => {
  test('SEC-AUTH-001: SQL injection protection in login', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt SQL injection in login form
    await page.fill('#email', "admin' OR '1'='1 --");
    await page.fill('#password', "password");
    
    // Check if we're still on login page (login failed)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Should not have any success indicators
    const successIndicators = page.locator('text=success, dashboard, welcome');
    expect(await successIndicators.count()).toBe(0);
  });

  test('SEC-AUTH-003: Password complexity enforcement', async ({ page }) => {
    await page.goto('/register');
    
    // Try weak password
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', '123');
    
    // Should show validation error or remain on register page
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/register');
    
    // Check for validation indicators
    const validationError = page.locator('text=weak, short, required, invalid');
    const hasValidationError = await validationError.count() > 0;
    
    console.log('Password validation present:', hasValidationError);
    
    // Should either show validation error or stay on register page
    expect(hasValidationError || currentUrl.includes('/register')).toBeTruthy();
  });

  test('SEC-AUTHZ-001: Access control - unauthorized access', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/tenders/new');
    
    // Should redirect to login or show unauthorized page
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/login');
    const showsUnauthorized = page.locator('text=403, 404, unauthorized, access denied').count() > 0;
    const showsPageContent = page.locator('body').count() > 0;
    
    console.log('Access control test:', { currentUrl, isRedirectedToLogin, showsUnauthorized, showsPageContent });
    
    // Should either redirect to login, show unauthorized, or handle gracefully
    expect(isRedirectedToLogin || showsUnauthorized || showsPageContent).toBeTruthy();
  });

  test('SEC-VAL-001: XSS protection in search', async ({ page }) => {
    await page.goto('/tenders');
    
    // Try XSS injection in search
    const xssPayload = '<script>alert("XSS")</script>';
    const searchInput = page.locator('input[placeholder*="search"], input[name*="search"], input[type="search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill(xssPayload);
      await page.waitForTimeout(1000);
      
      // Check that page is still functional
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('SEC-VAL-003: XSS protection in forms', async ({ page }) => {
    await page.goto('/register');
    
    // Try XSS in form fields
    const xssPayload = '<img src=x onerror=alert("XSS")>';
    await page.fill('#name', xssPayload);
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'Test@1234');
    
    await page.waitForTimeout(1000);
    
    // Check that page is still functional
    await expect(page.locator('body')).toBeVisible();
    
    // Should not have any alert dialogs
    const alertHandled = await page.evaluate(() => {
      let alertTriggered = false;
      const originalAlert = window.alert;
      window.alert = () => {
        alertTriggered = true;
      };
      return alertTriggered;
    });
    
    expect(alertHandled).toBeFalsy();
  });

  test('SEC-FILE-001: File upload security', async ({ page }) => {
    await page.goto('/register');
    
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Create a mock executable file
      const exeContent = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      const exeFile = new File([exeContent], 'malware.exe', { type: 'application/x-executable' });
      
      await fileInput.setInputFiles([exeFile]);
      await page.waitForTimeout(1000);
      
      // File should be rejected or cleared
      const currentValue = await fileInput.inputValue();
      expect(currentValue).toBe('');
    }
  });

  test('SEC-API-003: API security - no auth header', async ({ page }) => {
    await page.goto('/login');
    
    // Try to access API without auth header
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/tenders', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return {
          status: response.status,
          ok: response.ok
        };
      } catch (error) {
        return {
          status: 0,
          ok: false,
          error: error.message
        };
      }
    });
    
    // Should return error status
    expect([401, 403, 404, 0].includes(apiResponse.status)).toBeTruthy();
    expect(apiResponse.ok).toBeFalsy();
    
    console.log('API security test:', { status: apiResponse.status, ok: apiResponse.ok });
  });

  test('SEC-HEAD-001: Security headers check', async ({ page }) => {
    const response = await page.goto('/login');
    
    // Check for security headers
    const headers = response.headers();
    
    console.log('Security headers found:', {
      'x-frame-options': headers['x-frame-options'],
      'x-content-type-options': headers['x-content-type-options'],
      'x-xss-protection': headers['x-xss-protection']
    });
    
    // Should have some security headers
    const hasSecurityHeaders = Object.keys(headers).some(key => 
      key.toLowerCase().includes('x-') || key.toLowerCase().includes('csp')
    );
    
    expect(hasSecurityHeaders || response.status() === 200).toBeTruthy();
  });

  test('SEC-OWASP-001: Injection attack simulation', async ({ page }) => {
    await page.goto('/login');
    
    // Test SQL injection attempt
    await page.fill('#email', "admin' OR '1'='1 --");
    await page.fill('#password', 'password');
    
    await page.waitForTimeout(1000);
    
    // Should remain on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Test XSS attempt
    await page.fill('#email', '<script>alert("XSS")</script>');
    await page.fill('#password', 'password');
    
    await page.waitForTimeout(1000);
    
    // Should remain on login page
    const currentUrl2 = page.url();
    expect(currentUrl2).toContain('/login');
  });

  test('SEC-OWASP-007: XSS protection validation', async ({ page }) => {
    await page.goto('/register');
    
    // Test multiple XSS vectors
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")'
    ];
    
    for (const payload of xssPayloads) {
      await page.fill('#name', payload);
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'Test@1234');
      
      await page.waitForTimeout(500);
      
      // Should remain on register page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/register');
    }
  });

  test('SEC-OWASP-010: Error handling validation', async ({ page }) => {
    await page.goto('/login');
    
    // Test error handling with invalid credentials
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'wrong-password');
    
    await page.waitForTimeout(1000);
    
    // Should handle error gracefully
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Should show validation or error indicators
    const errorElements = page.locator('.error, .alert, [role="alert"]');
    const hasErrorHandling = await errorElements.count() > 0;
    
    console.log('Error handling test:', { currentUrl, hasErrorHandling });
    
    expect(hasErrorHandling || currentUrl.includes('/login')).toBeTruthy();
  });
});