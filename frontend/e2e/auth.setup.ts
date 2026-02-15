import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000/api';
const AUTH_FILE = path.join(__dirname, '.auth', 'user.json');

setup('authenticate as buyer', async ({ page }) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-E2E': 'true' },
    body: JSON.stringify({ email: 'buyer@test.com', password: 'Test@1234' }),
  });
  const text = await res.text();
  let json: { data?: { accessToken: string; refreshToken: string }; accessToken?: string; refreshToken?: string };
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Login API failed: ${res.status} ${text.slice(0, 100)}`);
  }
  if (!res.ok) throw new Error(`Login API failed: ${res.status} ${JSON.stringify(json)}`);
  const auth = json.data || json;
  if (!auth?.accessToken) throw new Error('No accessToken in login response');

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
});
