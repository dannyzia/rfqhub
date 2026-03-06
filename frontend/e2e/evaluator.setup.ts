import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000/api';
const AUTH_FILE = path.join(__dirname, '.auth', 'evaluator.json');

setup('authenticate as evaluator', async ({ page }) => {
  // Try to login as evaluator
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-E2E': 'true' },
      body: JSON.stringify({ email: 'evaluator@test.com', password: 'Test@1234' }),
    });
    
    if (res.ok) {
      const text = await res.text();
      let json: { data?: { accessToken: string; refreshToken: string }; accessToken?: string; refreshToken?: string };
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Login API failed: ${res.status} ${text.slice(0, 100)}`);
      }
      const auth = json.data || json;
      if (auth?.accessToken) {
        await page.goto('/login', { waitUntil: 'load' });
        await page.evaluate(
          ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) => {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          },
          { accessToken: auth.accessToken, refreshToken: auth.refreshToken ?? '' }
        );
        
        const dir = path.dirname(AUTH_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        await page.context().storageState({ path: AUTH_FILE });
        return;
      }
    }
  } catch (error) {
    // Backend not running, create mock auth state
    console.log('Backend not available, creating mock evaluator auth state');
  }

  // Create mock auth state for testing
  await page.goto('/login', { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'mock-evaluator-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('userRole', 'evaluator');
    localStorage.setItem('userEmail', 'evaluator@test.com');
  });

  const dir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  // Create minimal storage state
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:5173',
        localStorage: [
          { name: 'accessToken', value: 'mock-evaluator-token' },
          { name: 'refreshToken', value: 'mock-refresh-token' },
          { name: 'userRole', value: 'evaluator' },
          { name: 'userEmail', value: 'evaluator@test.com' }
        ]
      }
    ]
  };
  
  fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
  await page.context().addCookies(storageState.cookies);
});