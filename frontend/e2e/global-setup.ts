/**
 * Ensures the E2E test users exist before running tests.
 * Backend must be running at VITE_API_URL or http://localhost:3000
 */
const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000/api';

async function ensureTestUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string,
  companyName?: string
) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      role,
      companyName,
    }),
  });
  if (res.ok) {
    console.log(`[e2e global-setup] Test user registered: ${email}`);
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 409 || (data?.error?.message && data.error.message.includes('already exists'))) {
    console.log(`[e2e global-setup] Test user already exists: ${email}`);
    return;
  }
  console.warn(`[e2e global-setup] Register failed for ${email}:`, res.status, data);
}

export default async function globalSetup() {
  try {
    // Ensure buyer user exists
    await ensureTestUser(
      'buyer@test.com',
      'Test@1234',
      'Test',
      'Buyer',
      'buyer',
      'Test Company'
    );

    // Ensure evaluator user exists
    await ensureTestUser(
      'evaluator@test.com',
      'password123',
      'Test',
      'Evaluator',
      'evaluator',
      'Test Company'
    );
  } catch (e) {
    console.warn('[e2e global-setup] Could not ensure test users (is backend running?):', e);
  }
}
