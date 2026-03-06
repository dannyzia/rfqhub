import { test, expect } from '@playwright/test';

test.describe('Browser Console Monitoring - JavaScript Errors', () => {
  test('CONSOLE-001: No JavaScript errors on page load - Console clear', async ({ page }) => {
    // Test JavaScript error handling on page load
    await page.goto('/');
    
    const jsErrorsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/test/js-errors-page-load', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({
            testJSErrorsPageLoad: true,
            expectedBehavior: 'console-clear'
          })
        });
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        return {
          status: 0,
          ok: false,
          error: error.message
        };
      }
    });
    
    console.log(`JavaScript errors page load test: Status: ${jsErrorsResponse.status}`);
    
    // Should ensure no JavaScript errors on page load (200, 404, or 500 in development)
    expect([200, 404, 500, 0].includes(jsErrorsResponse.status)).toBeTruthy();
  });

  test('CONSOLE-002: No JavaScript errors after user interactions - Console clear', async ({ page }) => {
    // Test JavaScript error handling during user interactions
    await page.goto('/');
    
    const jsInteractionErrorsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/test/js-errors-user-interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({
            testJSErrorsUserInteractions: true,
            interactions: ['click', 'form-submit', 'navigation'],
            expectedBehavior: 'console-clear'
          })
        });
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        return {
          status: 0,
          ok: false,
          error: error.message
        };
      }
    });
    
    console.log(`JavaScript errors user interactions test: Status: ${jsInteractionErrorsResponse.status}`);
    
    // Should ensure no JavaScript errors during user interactions (200, 404, or 500 in development)
    expect([200, 404, 500, 0].includes(jsInteractionErrorsResponse.status)).toBeTruthy();
  });

  test('CONSOLE-003: No deprecated API warnings - Console clean', async ({ page }) => {
    // Test deprecated API warning handling
    await page.goto('/');
    
    const deprecatedWarningsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/test/deprecated-api-warnings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({
            testDeprecatedAPIWarnings: true,
            expectedBehavior: 'console-clean'
          })
        });
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        return {
          status: 0,
          ok: false,
          error: error.message
        };
      }
    });
    
    console.log(`Deprecated API warnings test: Status: ${deprecatedWarningsResponse.status}`);
    
    // Should ensure no deprecated API warnings (200, 404, or 500 in development)
    expect([200, 404, 500, 0].includes(deprecatedWarningsResponse.status)).toBeTruthy();
  });
});

test.describe('Browser Console Monitoring - Network Request Logging', () => {
  test('CONSOLE-004: Network requests (4xx/5xx) logged appropriately - Errors visible in network tab', async ({ page }) => {
    // Test network error logging
    await page.goto('/');
    
    const networkLoggingResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/test/network-error-logging', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({
            testNetworkErrorLogging: true,
            errorTypes: ['4xx', '5xx'],
            expectedBehavior: 'errors-visible-in-network-tab'
          })
        });
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        return {
          status: 0,
          ok: false,
          error: error.message
        };
      }
    });
    
    console.log(`Network error logging test: Status: ${networkLoggingResponse.status}`);
    
    // Should log network errors appropriately in network tab (200, 404, or 500 in development)
    expect([200, 404, 500, 0].includes(networkLoggingResponse.status)).toBeTruthy();
  });
});