/**
 * Ensures the E2E test user exists before running tests.
 * Backend must be running at VITE_API_URL or http://localhost:3000
 */
const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000/api';

async function ensureTestUser() {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'buyer@test.com',
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'Buyer',
      role: 'buyer',
      companyName: 'Test Company',
    }),
  });
  if (res.ok) {
    console.log('[e2e global-setup] Test user registered: buyer@test.com');
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 409 || (data?.error?.message && data.error.message.includes('already exists'))) {
    console.log('[e2e global-setup] Test user already exists: buyer@test.com');
    return;
  }
  console.warn('[e2e global-setup] Register failed:', res.status, data);
}

export default async function globalSetup() {
  try {
    await ensureTestUser();
  } catch (e) {
    console.warn('[e2e global-setup] Could not ensure test user (is backend running?):', e);
  }
}
