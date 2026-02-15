# PHASE 7: FRONTEND & TESTING
## Micro-Task Execution Plan with Tracking

> **FOR AI CODING AGENT**: Execute tasks IN ORDER. Mark status after each task.
> **PREREQUISITE**: Phase 1, 2, 3, 4, 5, and 6 must be 100% complete before starting Phase 7.

---

## SYSTEM PROMPT (Copy this to agent before starting)

```
You are a code-only execution agent. You will receive micro-tasks one at a time.

RULES:
1. Execute EXACTLY what is specified - no more, no less
2. Do NOT add features not requested
3. Do NOT refactor or "improve" existing code
4. If unclear, respond "BLOCKED: [reason]" and STOP
5. After completion, respond "✅ DONE" and wait for next task
6. Follow the code patterns in .rules/AGENT_RULES.md EXACTLY

CURRENT PHASE: Phase 7 - Frontend & Testing
TECH STACK:
- Frontend: SvelteKit 2.x + TypeScript + Tailwind CSS
- Backend: Already complete from Phases 1-6

You are now ready. Wait for Task 7.1.
```

---

## TASK TRACKING LEGEND

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |
| ❌ | Failed - needs retry |
| ⏸️ | Blocked - needs clarification |

---

# TASK 7.1: Initialize SvelteKit Project

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.1: Initialize SvelteKit project

Run these commands:

cd rfq-platform
npm create svelte@latest frontend

When prompted, select:
- Skeleton project
- Yes to TypeScript
- Yes to ESLint
- Yes to Prettier
- No to Playwright (we'll add it manually)
- No to Vitest (we'll add it manually)

Then:
cd frontend
npm install

Respond "✅ DONE" when project is initialized.
```

### EXPECTED OUTPUT:
- SvelteKit project created at `rfq-platform/frontend`
- package.json exists with SvelteKit dependencies

### VERIFICATION:
- [ ] `rfq-platform/frontend/package.json` exists
- [ ] `rfq-platform/frontend/svelte.config.js` exists
- [ ] `rfq-platform/frontend/src/routes/+page.svelte` exists

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.2: Install Frontend Dependencies

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.2: Install frontend dependencies

Run in rfq-platform/frontend:

npm install @tanstack/svelte-query zod date-fns

npm install -D tailwindcss postcss autoprefixer @playwright/test vitest @testing-library/svelte jsdom @types/node

npx tailwindcss init -p

Respond "✅ DONE" when all packages are installed.
```

### EXPECTED OUTPUT:
- All packages installed
- tailwind.config.js created
- postcss.config.js created

### VERIFICATION:
- [ ] package.json contains all dependencies
- [ ] tailwind.config.js exists
- [ ] postcss.config.js exists

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.3: Configure Tailwind CSS

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.3: Configure Tailwind CSS

MODIFY file: rfq-platform/frontend/tailwind.config.js

Replace ENTIRE content with:
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};

CREATE file: rfq-platform/frontend/src/app.css

Content:
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
  }
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700;
  }
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }
  .btn-danger {
    @apply bg-danger text-white hover:bg-red-600;
  }
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  .badge-success {
    @apply bg-green-100 text-green-800;
  }
  .badge-warning {
    @apply bg-yellow-100 text-yellow-800;
  }
  .badge-danger {
    @apply bg-red-100 text-red-800;
  }
  .badge-info {
    @apply bg-blue-100 text-blue-800;
  }
}

Respond "✅ DONE" when files are created/updated.
```

### EXPECTED OUTPUT:
- tailwind.config.js configured
- src/app.css created with Tailwind imports and custom components

### VERIFICATION:
- [ ] tailwind.config.js has custom colors
- [ ] src/app.css imports Tailwind and has custom components

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.4: Create Root Layout

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.4: Create root layout

MODIFY file: rfq-platform/frontend/src/routes/+layout.svelte

Replace ENTIRE content with:
<script lang="ts">
  import '../app.css';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { onMount } from 'svelte';
  import { authStore, initAuth } from '$lib/stores/auth';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  });

  onMount(() => {
    initAuth();
  });
</script>

<QueryClientProvider client={queryClient}>
  <div class="min-h-screen bg-gray-50">
    <slot />
  </div>
</QueryClientProvider>

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Root layout created with QueryClientProvider and auth initialization

### VERIFICATION:
- [ ] File exists at `src/routes/+layout.svelte`
- [ ] Imports app.css
- [ ] Sets up QueryClient

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.5: Create Auth Store

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.5: Create auth store

Create file: rfq-platform/frontend/src/lib/stores/auth.ts

Content (copy EXACTLY):
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { api } from '$lib/utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  orgId: string;
  organizationName?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  isInitialized: false,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    setUser(user: User | null, accessToken: string | null) {
      update(state => ({
        ...state,
        user,
        accessToken,
        isLoading: false,
        isInitialized: true,
      }));

      if (browser && accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
    },

    setLoading(isLoading: boolean) {
      update(state => ({ ...state, isLoading }));
    },

    logout() {
      if (browser) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      set({ ...initialState, isLoading: false, isInitialized: true });
      goto('/login');
    },

    reset() {
      set(initialState);
    },
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const isAuthenticated = derived(authStore, $auth => $auth.user !== null);
export const isLoading = derived(authStore, $auth => $auth.isLoading);
export const isAdmin = derived(authStore, $auth => $auth.user?.roles.includes('admin') ?? false);
export const isBuyer = derived(authStore, $auth => $auth.user?.roles.includes('buyer') ?? false);
export const isVendor = derived(authStore, $auth => $auth.user?.roles.includes('vendor') ?? false);
export const isEvaluator = derived(authStore, $auth => $auth.user?.roles.includes('evaluator') ?? false);

// Initialize auth from stored token
export async function initAuth(): Promise<void> {
  if (!browser) return;

  const token = localStorage.getItem('accessToken');
  if (!token) {
    authStore.setUser(null, null);
    return;
  }

  try {
    const response = await api.get<{ user: User }>('/auth/me');
    authStore.setUser(response.user, token);
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    authStore.logout();
  }
}

// Login function
export async function login(email: string, password: string): Promise<void> {
  authStore.setLoading(true);

  try {
    const response = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/login',
      { email, password }
    );

    if (browser) {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    authStore.setUser(response.user, response.accessToken);
    goto('/dashboard');
  } catch (error) {
    authStore.setLoading(false);
    throw error;
  }
}

// Register function
export async function register(data: {
  name: string;
  email: string;
  password: string;
  organizationId: string;
  roles?: string[];
}): Promise<void> {
  authStore.setLoading(true);

  try {
    await api.post('/auth/register', data);
    authStore.setLoading(false);
    goto('/login?registered=true');
  } catch (error) {
    authStore.setLoading(false);
    throw error;
  }
}

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/frontend/src/lib/stores/auth.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports authStore and derived stores
- [ ] Exports login, register, and initAuth functions

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.6: Create API Utility

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.6: Create API utility

Create file: rfq-platform/frontend/src/lib/utils/api.ts

Content (copy EXACTLY):
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('accessToken');
  }

  private async refreshToken(): Promise<string | null> {
    if (!browser) return null;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      ...options,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, config);

    // Handle token refresh on 401
    if (response.status === 401 && browser) {
      const newToken = await this.refreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        config.headers = headers;
        response = await fetch(`${this.baseUrl}${endpoint}`, config);
      } else {
        goto('/login');
        throw new Error('Session expired');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' };
      throw error;
    }

    return data as T;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  async uploadFile<T>(endpoint: string, file: File, fieldName: string = 'file'): Promise<T> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data.error || { code: 'UPLOAD_ERROR', message: 'File upload failed' };
    }

    return data as T;
  }
}

export const api = new ApiClient(API_BASE_URL);

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/frontend/src/lib/utils/api.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports api instance with get, post, put, delete, uploadFile methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.7: Create Environment Config

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.7: Create environment configuration

Create file: rfq-platform/frontend/.env

Content:
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=RFQ Buddy

Create file: rfq-platform/frontend/.env.example

Content:
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=RFQ Buddy

Respond "✅ DONE" when files are created.
```

### EXPECTED OUTPUT:
- .env file created
- .env.example file created

### VERIFICATION:
- [ ] .env exists with correct variables
- [ ] .env.example exists

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.8: Create Auth Layout Group

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.8: Create auth layout group (no navbar)

Create file: rfq-platform/frontend/src/routes/(auth)/+layout.svelte

Content (copy EXACTLY):
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated, isLoading } from '$lib/stores/auth';

  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe(authenticated => {
      if (authenticated) {
        goto('/dashboard');
      }
    });

    return unsubscribe;
  });
</script>

{#if $isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">RFQ Buddy</h1>
        <p class="text-gray-600 mt-2">Online RFQ & Tendering Platform</p>
      </div>
      <slot />
    </div>
  </div>
{/if}

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Auth layout created without navbar

### VERIFICATION:
- [ ] File exists at `src/routes/(auth)/+layout.svelte`
- [ ] Redirects authenticated users to dashboard

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.9: Create Login Page

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.9: Create login page

Create file: rfq-platform/frontend/src/routes/(auth)/login/+page.svelte

Content (copy EXACTLY):
<script lang="ts">
  import { page } from '$app/stores';
  import { login, isLoading } from '$lib/stores/auth';

  let email = '';
  let password = '';
  let error = '';

  $: registered = $page.url.searchParams.get('registered') === 'true';

  async function handleSubmit() {
    error = '';
    try {
      await login(email, password);
    } catch (e: any) {
      error = e.message || 'Login failed. Please check your credentials.';
    }
  }
</script>

<svelte:head>
  <title>Login - RFQ Buddy</title>
</svelte:head>

<div class="card">
  <h2 class="text-2xl font-semibold text-gray-900 mb-6">Sign In</h2>

  {#if registered}
    <div class="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
      Registration successful! Please sign in.
    </div>
  {/if}

  {#if error}
    <div class="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <input
        type="email"
        id="email"
        bind:value={email}
        class="input"
        placeholder="you@example.com"
        required
        disabled={$isLoading}
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
        Password
      </label>
      <input
        type="password"
        id="password"
        bind:value={password}
        class="input"
        placeholder="••••••••"
        required
        disabled={$isLoading}
      />
    </div>

    <div class="flex items-center justify-between">
      <label class="flex items-center">
        <input type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
        <span class="ml-2 text-sm text-gray-600">Remember me</span>
      </label>
      <a href="/forgot-password" class="text-sm text-primary-600 hover:text-primary-500">
        Forgot password?
      </a>
    </div>

    <button
      type="submit"
      class="w-full btn btn-primary"
      disabled={$isLoading}
    >
      {#if $isLoading}
        <span class="flex items-center justify-center">
          <span class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          Signing in...
        </span>
      {:else}
        Sign In
      {/if}
    </button>
  </form>

  <p class="mt-6 text-center text-sm text-gray-600">
    Don't have an account?
    <a href="/register" class="text-primary-600 hover:text-primary-500 font-medium">
      Register now
    </a>
  </p>
</div>

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Login page created

### VERIFICATION:
- [ ] File exists at `src/routes/(auth)/login/+page.svelte`
- [ ] Has email and password inputs
- [ ] Handles login submission

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.10: Create Register Page

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.10: Create register page

Create file: rfq-platform/frontend/src/routes/(auth)/register/+page.svelte

Content (copy EXACTLY):
<script lang="ts">
  import { register, isLoading } from '$lib/stores/auth';

  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let organizationId = '';
  let accountType: 'buyer' | 'vendor' = 'vendor';
  let error = '';
  let errors: Record<string, string> = {};

  function validatePassword(pwd: string): string[] {
    const issues: string[] = [];
    if (pwd.length < 12) issues.push('At least 12 characters');
    if (!/[A-Z]/.test(pwd)) issues.push('One uppercase letter');
    if (!/[a-z]/.test(pwd)) issues.push('One lowercase letter');
    if (!/[0-9]/.test(pwd)) issues.push('One digit');
    if (!/[^A-Za-z0-9]/.test(pwd)) issues.push('One special character');
    return issues;
  }

  async function handleSubmit() {
    error = '';
    errors = {};

    // Validate password
    const pwdIssues = validatePassword(password);
    if (pwdIssues.length > 0) {
      errors.password = `Password must have: ${pwdIssues.join(', ')}`;
      return;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        organizationId,
        roles: [accountType],
      });
    } catch (e: any) {
      if (e.details) {
        e.details.forEach((d: { field: string; message: string }) => {
          errors[d.field] = d.message;
        });
      } else {
        error = e.message || 'Registration failed. Please try again.';
      }
    }
  }
</script>

<svelte:head>
  <title>Register - RFQ Buddy</title>
</svelte:head>

<div class="card">
  <h2 class="text-2xl font-semibold text-gray-900 mb-6">Create Account</h2>

  {#if error}
    <div class="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="accountType" class="block text-sm font-medium text-gray-700 mb-1">
        Account Type
      </label>
      <div class="flex space-x-4">
        <label class="flex items-center">
          <input
            type="radio"
            bind:group={accountType}
            value="vendor"
            class="text-primary-600 focus:ring-primary-500"
          />
          <span class="ml-2">Vendor (Supplier)</span>
        </label>
        <label class="flex items-center">
          <input
            type="radio"
            bind:group={accountType}
            value="buyer"
            class="text-primary-600 focus:ring-primary-500"
          />
          <span class="ml-2">Buyer (Purchaser)</span>
        </label>
      </div>
    </div>

    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
        Full Name
      </label>
      <input
        type="text"
        id="name"
        bind:value={name}
        class="input"
        class:border-red-500={errors.name}
        placeholder="John Doe"
        required
        disabled={$isLoading}
      />
      {#if errors.name}
        <p class="text-red-500 text-sm mt-1">{errors.name}</p>
      {/if}
    </div>

    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <input
        type="email"
        id="email"
        bind:value={email}
        class="input"
        class:border-red-500={errors.email}
        placeholder="you@example.com"
        required
        disabled={$isLoading}
      />
      {#if errors.email}
        <p class="text-red-500 text-sm mt-1">{errors.email}</p>
      {/if}
    </div>

    <div>
      <label for="organizationId" class="block text-sm font-medium text-gray-700 mb-1">
        Organization ID
      </label>
      <input
        type="text"
        id="organizationId"
        bind:value={organizationId}
        class="input"
        class:border-red-500={errors.organizationId}
        placeholder="Enter your organization ID"
        required
        disabled={$isLoading}
      />
      {#if errors.organizationId}
        <p class="text-red-500 text-sm mt-1">{errors.organizationId}</p>
      {/if}
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
        Password
      </label>
      <input
        type="password"
        id="password"
        bind:value={password}
        class="input"
        class:border-red-500={errors.password}
        placeholder="••••••••••••"
        required
        disabled={$isLoading}
      />
      {#if errors.password}
        <p class="text-red-500 text-sm mt-1">{errors.password}</p>
      {/if}
      <p class="text-gray-500 text-xs mt-1">
        Min 12 chars, uppercase, lowercase, digit, special character
      </p>
    </div>

    <div>
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
        Confirm Password
      </label>
      <input
        type="password"
        id="confirmPassword"
        bind:value={confirmPassword}
        class="input"
        class:border-red-500={errors.confirmPassword}
        placeholder="••••••••••••"
        required
        disabled={$isLoading}
      />
      {#if errors.confirmPassword}
        <p class="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
      {/if}
    </div>

    <button
      type="submit"
      class="w-full btn btn-primary"
      disabled={$isLoading}
    >
      {#if $isLoading}
        <span class="flex items-center justify-center">
          <span class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          Creating account...
        </span>
      {:else}
        Create Account
      {/if}
    </button>
  </form>

  <p class="mt-6 text-center text-sm text-gray-600">
    Already have an account?
    <a href="/login" class="text-primary-600 hover:text-primary-500 font-medium">
      Sign in
    </a>
  </p>
</div>

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Register page created

### VERIFICATION:
- [ ] File exists at `src/routes/(auth)/register/+page.svelte`
- [ ] Has all required fields
- [ ] Validates password requirements

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.11: Create App Layout Group

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.11: Create app layout group (with navbar)

Create file: rfq-platform/frontend/src/routes/(app)/+layout.svelte

Content (copy EXACTLY):
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore, isAuthenticated, isLoading, user, isBuyer, isVendor, isAdmin } from '$lib/stores/auth';

  let isMobileMenuOpen = false;
  let isUserMenuOpen = false;

  $: currentPath = $page.url.pathname;

  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe(authenticated => {
      if (!$isLoading && !authenticated) {
        goto('/login');
      }
    });

    return unsubscribe;
  });

  function handleLogout() {
    authStore.logout();
  }

  interface NavItem {
    href: string;
    label: string;
    roles?: string[];
  }

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tenders', label: 'Tenders' },
    { href: '/vendors', label: 'Vendors', roles: ['buyer', 'admin'] },
    { href: '/profile', label: 'Profile' },
  ];

  function canAccess(item: NavItem): boolean {
    if (!item.roles) return true;
    return item.roles.some(role => $user?.roles.includes(role));
  }
</script>

{#if $isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
{:else if $isAuthenticated}
  <div class="min-h-screen">
    <!-- Top Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <a href="/dashboard" class="text-xl font-bold text-primary-600">
                RFQ Buddy
              </a>
            </div>

            <!-- Desktop Navigation -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              {#each navItems as item}
                {#if canAccess(item)}
                  <a
                    href={item.href}
                    class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      {currentPath.startsWith(item.href)
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
                  >
                    {item.label}
                  </a>
                {/if}
              {/each}
            </div>
          </div>

          <!-- User Menu -->
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
            <div class="relative">
              <button
                type="button"
                class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                on:click={() => isUserMenuOpen = !isUserMenuOpen}
              >
                <span class="sr-only">Open user menu</span>
                <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span class="text-primary-700 font-medium">
                    {$user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span class="ml-2 text-gray-700">{$user?.name}</span>
              </button>

              {#if isUserMenuOpen}
                <div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div class="py-1">
                    <a
                      href="/profile"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      on:click={() => isUserMenuOpen = false}
                    >
                      Your Profile
                    </a>
                    {#if $isAdmin}
                      <a
                        href="/admin"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        on:click={() => isUserMenuOpen = false}
                      >
                        Admin Panel
                      </a>
                    {/if}
                    <button
                      type="button"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      on:click={handleLogout}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="flex items-center sm:hidden">
            <button
              type="button"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              on:click={() => isMobileMenuOpen = !isMobileMenuOpen}
            >
              <span class="sr-only">Open main menu</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      {#if isMobileMenuOpen}
        <div class="sm:hidden">
          <div class="pt-2 pb-3 space-y-1">
            {#each navItems as item}
              {#if canAccess(item)}
                <a
                  href={item.href}
                  class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                    {currentPath.startsWith(item.href)
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}"
                  on:click={() => isMobileMenuOpen = false}
                >
                  {item.label}
                </a>
              {/if}
            {/each}
          </div>
          <div class="pt-4 pb-3 border-t border-gray-200">
            <div class="flex items-center px-4">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span class="text-primary-700 font-medium text-lg">
                    {$user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div class="ml-3">
                <div class="text-base font-medium text-gray-800">{$user?.name}</div>
                <div class="text-sm font-medium text-gray-500">{$user?.email}</div>
              </div>
            </div>
            <div class="mt-3 space-y-1">
              <button
                type="button"
                class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                on:click={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      {/if}
    </nav>

    <!-- Page Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
{/if}

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- App layout created with navbar

### VERIFICATION:
- [ ] File exists at `src/routes/(app)/+layout.svelte`
- [ ] Has responsive navigation
- [ ] Redirects unauthenticated users to login

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.12: Create Dashboard Page

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.12: Create dashboard page

Create file: rfq-platform/frontend/src/routes/(app)/dashboard/+page.svelte

Content (copy EXACTLY):
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';
  import { user, isBuyer, isVendor } from '$lib/stores/auth';

  interface DashboardStats {
    totalTenders: number;
    activeTenders: number;
    pendingBids: number;
    submittedBids: number;
    awardedTenders: number;
  }

  interface RecentTender {
    id: string;
    tenderNumber: string;
    title: string;
    status: string;
    submissionDeadline: string;
  }

  const statsQuery = createQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  });

  const recentTendersQuery = createQuery({
    queryKey: ['recent-tenders'],
    queryFn: () => api.get<{ tenders: RecentTender[] }>('/tenders?limit=5'),
  });

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'badge-info';
      case 'published': return 'badge-success';
      case 'closed': return 'badge-warning';
      case 'awarded': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>Dashboard - RFQ Buddy</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
    <p class="text-gray-600">Welcome back, {$user?.name}!</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#if $statsQuery.isLoading}
      {#each Array(4) as _}
        <div class="card animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      {/each}
    {:else if $statsQuery.data}
      <div class="card">
        <p class="text-sm font-medium text-gray-500">Total Tenders</p>
        <p class="text-3xl font-bold text-gray-900">{$statsQuery.data.totalTenders || 0}</p>
      </div>
      <div class="card">
        <p class="text-sm font-medium text-gray-500">Active Tenders</p>
        <p class="text-3xl font-bold text-primary-600">{$statsQuery.data.activeTenders || 0}</p>
      </div>
      {#if $isVendor}
        <div class="card">
          <p class="text-sm font-medium text-gray-500">Pending Bids</p>
          <p class="text-3xl font-bold text-warning">{$statsQuery.data.pendingBids || 0}</p>
        </div>
        <div class="card">
          <p class="text-sm font-medium text-gray-500">Submitted Bids</p>
          <p class="text-3xl font-bold text-success">{$statsQuery.data.submittedBids || 0}</p>
        </div>
      {:else}
        <div class="card">
          <p class="text-sm font-medium text-gray-500">Pending Evaluation</p>
          <p class="text-3xl font-bold text-warning">{$statsQuery.data.pendingBids || 0}</p>
        </div>
        <div class="card">
          <p class="text-sm font-medium text-gray-500">Awarded</p>
          <p class="text-3xl font-bold text-success">{$statsQuery.data.awardedTenders || 0}</p>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Quick Actions -->
  <div class="card">
    <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
    <div class="flex flex-wrap gap-3">
      {#if $isBuyer}
        <a href="/tenders/new" class="btn btn-primary">
          Create New Tender
        </a>
        <a href="/vendors" class="btn btn-secondary">
          Manage Vendors
        </a>
      {/if}
      {#if $isVendor}
        <a href="/tenders" class="btn btn-primary">
          Browse Tenders
        </a>
        <a href="/profile" class="btn btn-secondary">
          Update Profile
        </a>
      {/if}
    </div>
  </div>

  <!-- Recent Tenders -->
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium text-gray-900">Recent Tenders</h2>
      <a href="/tenders" class="text-primary-600 hover:text-primary-500 text-sm font-medium">
        View all →
      </a>
    </div>

    {#if $recentTendersQuery.isLoading}
      <div class="space-y-3">
        {#each Array(5) as _}
          <div class="animate-pulse flex items-center justify-between py-3 border-b border-gray-100">
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-48"></div>
              <div class="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div class="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        {/each}
      </div>
    {:else if $recentTendersQuery.data?.tenders?.length}
      <div class="divide-y divide-gray-100">
        {#each $recentTendersQuery.data.tenders as tender}
          <a
            href="/tenders/{tender.id}"
            class="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
          >
            <div>
              <p class="font-medium text-gray-900">{tender.title}</p>
              <p class="text-sm text-gray-500">
                {tender.tenderNumber} • Deadline: {formatDate(tender.submissionDeadline)}
              </p>
            </div>
            <span class="badge {getStatusBadgeClass(tender.status)}">
              {tender.status}
            </span>
          </a>
        {/each}
      </div>
    {:else}
      <p class="text-gray-500 text-center py-8">No tenders found</p>
    {/if}
  </div>
</div>

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Dashboard page created

### VERIFICATION:
- [ ] File exists at `src/routes/(app)/dashboard/+page.svelte`
- [ ] Shows stats cards
- [ ] Shows recent tenders

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.13: Create Tenders List Page

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.13: Create tenders list page

Create file: rfq-platform/frontend/src/routes/(app)/tenders/+page.svelte

Content (copy EXACTLY):
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';
  import { isBuyer } from '$lib/stores/auth';

  interface Tender {
    id: string;
    tenderNumber: string;
    title: string;
    tenderType: string;
    visibility: string;
    procurementType: string;
    currency: string;
    status: string;
    submissionDeadline: string;
    createdAt: string;
  }

  let statusFilter = '';
  let typeFilter = '';
  let searchQuery = '';

  $: queryParams = new URLSearchParams();
  $: {
    if (statusFilter) queryParams.set('status', statusFilter);
    if (typeFilter) queryParams.set('type', typeFilter);
    if (searchQuery) queryParams.set('search', searchQuery);
  }

  $: tendersQuery = createQuery({
    queryKey: ['tenders', statusFilter, typeFilter, searchQuery],
    queryFn: () => api.get<{ tenders: Tender[]; total: number }>(`/tenders?${queryParams.toString()}`),
  });

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'badge-info';
      case 'published': return 'badge-success';
      case 'clarification': return 'badge-warning';
      case 'closed': return 'badge-warning';
      case 'tech_eval': return 'badge-info';
      case 'comm_eval': return 'badge-info';
      case 'awarded': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function isDeadlineSoon(deadline: string): boolean {
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 days
  }
</script>

<svelte:head>
  <title>Tenders - RFQ Buddy</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-semibold text-gray-900">Tenders</h1>
    {#if $isBuyer}
      <a href="/tenders/new" class="btn btn-primary">
        + Create Tender
      </a>
    {/if}
  </div>

  <!-- Filters -->
  <div class="card">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          id="search"
          bind:value={searchQuery}
          class="input"
          placeholder="Search tenders..."
        />
      </div>
      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select id="status" bind:value={statusFilter} class="input">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="tech_eval">Technical Evaluation</option>
          <option value="comm_eval">Commercial Evaluation</option>
          <option value="awarded">Awarded</option>
        </select>
      </div>
      <div>
        <label for="type" class="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select id="type" bind:value={typeFilter} class="input">
          <option value="">All Types</option>
          <option value="RFQ">RFQ</option>
          <option value="TENDER">Tender</option>
        </select>
      </div>
      <div class="flex items-end">
        <button
          type="button"
          class="btn btn-secondary"
          on:click={() => { statusFilter = ''; typeFilter = ''; searchQuery = ''; }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  </div>

  <!-- Tenders List -->
  {#if $tendersQuery.isLoading}
    <div class="space-y-4">
      {#each Array(5) as _}
        <div class="card animate-pulse">
          <div class="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      {/each}
    </div>
  {:else if $tendersQuery.error}
    <div class="card bg-red-50 border border-red-200">
      <p class="text-red-800">Error loading tenders. Please try again.</p>
    </div>
  {:else if $tendersQuery.data?.tenders?.length}
    <div class="space-y-4">
      {#each $tendersQuery.data.tenders as tender}
        <a href="/tenders/{tender.id}" class="card block hover:shadow-lg transition-shadow">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm text-gray-500">{tender.tenderNumber}</span>
                <span class="badge {getStatusBadgeClass(tender.status)}">
                  {tender.status.replace('_', ' ')}
                </span>
                {#if tender.status === 'published' && isDeadlineSoon(tender.submissionDeadline)}
                  <span class="badge badge-warning">Deadline Soon!</span>
                {/if}
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">{tender.title}</h3>
              <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Type: {tender.tenderType}</span>
                <span>Visibility: {tender.visibility}</span>
                <span>Currency: {tender.currency}</span>
                <span>Deadline: {formatDate(tender.submissionDeadline)}</span>
              </div>
            </div>
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      {/each}
    </div>

    {#if $tendersQuery.data.total > $tendersQuery.data.tenders.length}
      <div class="text-center">
        <p class="text-gray-500">
          Showing {$tendersQuery.data.tenders.length} of {$tendersQuery.data.total} tenders
        </p>
      </div>
    {/if}
  {:else}
    <div class="card text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No tenders found</h3>
      <p class="mt-1 text-sm text-gray-500">
        {#if $isBuyer}
          Get started by creating a new tender.
        {:else}
          Check back later for new opportunities.
        {/if}
      </p>
      {#if $isBuyer}
        <div class="mt-6">
          <a href="/tenders/new" class="btn btn-primary">
            + Create Tender
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Tenders list page created

### VERIFICATION:
- [ ] File exists at `src/routes/(app)/tenders/+page.svelte`
- [ ] Has search and filter functionality
- [ ] Shows tender cards

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.14: Create Tender Detail Page

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.14: Create tender detail page

Create file: rfq-platform/frontend/src/routes/(app)/tenders/[id]/+page.svelte

Content (copy EXACTLY):
<script lang="ts">
  import { page } from '$app/stores';
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';
  import { isBuyer, isVendor } from '$lib/stores/auth';

  $: tenderId = $page.params.id;

  interface Tender {
    id: string;
    tenderNumber: string;
    title: string;
    tenderType: string;
    visibility: string;
    procurementType: string;
    currency: string;
    status: string;
    submissionDeadline: string;
    bidOpeningTime: string | null;
    validityDays: number;
    fundAllocation: number | null;
    bidSecurityAmount: number | null;
    preBidMeetingDate: string | null;
    preBidMeetingLink: string | null;
    createdAt: string;
    updatedAt: string;
    terms?: {
      paymentTerms: string;
      deliveryTerms: string;
    };
  }

  interface TenderItem {
    id: string;
    slNo: number;
    itemType: 'group' | 'item';
    itemCode: string | null;
    itemName: string;
    specification: string | null;
    quantity: number;
    uom: string;
    parentItemId: string | null;
    children?: TenderItem[];
  }

  $: tenderQuery = createQuery({
    queryKey: ['tender', tenderId],
    queryFn: () => api.get<Tender>(`/tenders/${tenderId}`),
  });

  $: itemsQuery = createQuery({
    queryKey: ['tender-items', tenderId],
    queryFn: () => api.get<{ items: TenderItem[] }>(`/tenders/${tenderId}/items`),
  });

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatCurrency(amount: number | null, currency: string): string {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'badge-info';
      case 'published': return 'badge-success';
      case 'clarification': return 'badge-warning';
      case 'closed': return 'badge-warning';
      case 'tech_eval': return 'badge-info';
      case 'comm_eval': return 'badge-info';
      case 'awarded': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  }
</script>

<svelte:head>
  <title>{$tenderQuery.data?.title || 'Tender'} - RFQ Buddy</title>
</svelte:head>

{#if $tenderQuery.isLoading}
  <div class="animate-pulse space-y-6">
    <div class="h-8 bg-gray-200 rounded w-1/2"></div>
    <div class="card">
      <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div class="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
{:else if $tenderQuery.error}
  <div class="card bg-red-50 border border-red-200">
    <p class="text-red-800">Error loading tender. Please try again.</p>
  </div>
{:else if $tenderQuery.data}
  {@const tender = $tenderQuery.data}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <span class="text-sm text-gray-500">{tender.tenderNumber}</span>
          <span class="badge {getStatusBadgeClass(tender.status)}">
            {tender.status.replace('_', ' ')}
          </span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">{tender.title}</h1>
      </div>
      <div class="flex gap-3">
        {#if $isBuyer && tender.status === 'draft'}
          <a href="/tenders/{tender.id}/edit" class="btn btn-secondary">
            Edit
          </a>
          <button class="btn btn-primary">
            Publish
          </button>
        {/if}
        {#if $isVendor && tender.status === 'published'}
          <a href="/tenders/{tender.id}/bid" class="btn btn-primary">
            Submit Bid
          </a>
        {/if}
      </div>
    </div>

    <!-- Tender Details -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Info -->
        <div class="card">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Tender Information</h2>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Type</dt>
              <dd class="text-sm text-gray-900">{tender.tenderType}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Visibility</dt>
              <dd class="text-sm text-gray-900 capitalize">{tender.visibility}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Procurement Type</dt>
              <dd class="text-sm text-gray-900 capitalize">{tender.procurementType}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Currency</dt>
              <dd class="text-sm text-gray-900">{tender.currency}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Bid Security</dt>
              <dd class="text-sm text-gray-900">
                {formatCurrency(tender.bidSecurityAmount, tender.currency)}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Validity Period</dt>
              <dd class="text-sm text-gray-900">{tender.validityDays} days</dd>
            </div>
          </dl>
        </div>

        <!-- Line Items -->
        <div class="card">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Line Items</h2>
          {#if $itemsQuery.isLoading}
            <div class="animate-pulse space-y-2">
              {#each Array(3) as _}
                <div class="h-10 bg-gray-200 rounded"></div>
              {/each}
            </div>
          {:else if $itemsQuery.data?.items?.length}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specification</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each $itemsQuery.data.items as item}
                    <tr class={item.itemType === 'group' ? 'bg-gray-50 font-medium' : ''}>
                      <td class="px-4 py-3 text-sm text-gray-900">{item.slNo}</td>
                      <td class="px-4 py-3 text-sm text-gray-900">
                        {#if item.itemCode}
                          <span class="text-gray-500">[{item.itemCode}]</span>
                        {/if}
                        {item.itemName}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500">{item.specification || '-'}</td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.itemType === 'group' ? '-' : item.quantity}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500">
                        {item.itemType === 'group' ? '-' : item.uom}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="text-gray-500 text-center py-4">No line items added yet.</p>
          {/if}
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Deadlines -->
        <div class="card">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Important Dates</h2>
          <dl class="space-y-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Submission Deadline</dt>
              <dd class="text-sm text-gray-900 font-medium">
                {formatDate(tender.submissionDeadline)}
              </dd>
            </div>
            {#if tender.bidOpeningTime}
              <div>
                <dt class="text-sm font-medium text-gray-500">Bid Opening</dt>
                <dd class="text-sm text-gray-900">{formatDate(tender.bidOpeningTime)}</dd>
              </div>
            {/if}
            {#if tender.preBidMeetingDate}
              <div>
                <dt class="text-sm font-medium text-gray-500">Pre-Bid Meeting</dt>
                <dd class="text-sm text-gray-900">{formatDate(tender.preBidMeetingDate)}</dd>
                {#if tender.preBidMeetingLink}
                  <a href={tender.preBidMeetingLink} target="_blank" class="text-primary-600 hover:underline text-sm">
                    Join Meeting →
                  </a>
                {/if}
              </div>
            {/if}
          </dl>
        </div>

        <!-- Terms -->
        {#if tender.terms}
          <div class="card">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Terms</h2>
            <dl class="space-y-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Payment Terms</dt>
                <dd class="text-sm text-gray-900">{tender.terms.paymentTerms || 'Not specified'}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Delivery Terms</dt>
                <dd class="text-sm text-gray-900">{tender.terms.deliveryTerms || 'Not specified'}</dd>
              </div>
            </dl>
          </div>
        {/if}

        <!-- Actions -->
        <div class="card">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Actions</h2>
          <div class="space-y-2">
            <a href="/tenders/{tender.id}/questions" class="block w-full btn btn-secondary text-center">
              Questions & Clarifications
            </a>
            <a href="/tenders/{tender.id}/addenda" class="block w-full btn btn-secondary text-center">
              View Addenda
            </a>
            {#if $isBuyer}
              <a href="/tenders/{tender.id}/bids" class="block w-full btn btn-secondary text-center">
                View Bids
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Tender detail page created

### VERIFICATION:
- [ ] File exists at `src/routes/(app)/tenders/[id]/+page.svelte`
- [ ] Shows tender information
- [ ] Shows line items
- [ ] Has action buttons based on role

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.15: Create Lib Index

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.15: Create lib index file for re-exports

Create file: rfq-platform/frontend/src/lib/index.ts

Content (copy EXACTLY):
// Re-export stores
export * from './stores/auth';

// Re-export utils
export { api } from './utils/api';

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Lib index file created

### VERIFICATION:
- [ ] File exists at `src/lib/index.ts`
- [ ] Exports stores and utils

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.16: Create Vitest Configuration

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.16: Create Vitest configuration for unit tests

Create file: rfq-platform/frontend/vitest.config.ts

Content (copy EXACTLY):
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
  resolve: {
    alias: {
      $lib: '/src/lib',
      $app: '/src/tests/mocks/app',
    },
  },
});

Create file: rfq-platform/frontend/src/tests/setup.ts

Content (copy EXACTLY):
import '@testing-library/svelte/vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

Create folder: rfq-platform/frontend/src/tests/mocks

Create file: rfq-platform/frontend/src/tests/mocks/app/environment.ts

Content:
export const browser = true;

Create file: rfq-platform/frontend/src/tests/mocks/app/navigation.ts

Content:
export const goto = vi.fn();

Create file: rfq-platform/frontend/src/tests/mocks/app/stores.ts

Content:
import { writable } from 'svelte/store';

export const page = writable({
  url: new URL('http://localhost'),
  params: {},
});

Respond "✅ DONE" when files are created.
```

### EXPECTED OUTPUT:
- Vitest configuration created
- Test setup file created
- Mock files created

### VERIFICATION:
- [ ] vitest.config.ts exists
- [ ] src/tests/setup.ts exists
- [ ] src/tests/mocks/app/*.ts files exist

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.17: Create Unit Test for Auth Store

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.17: Create unit test for auth store

Create file: rfq-platform/frontend/src/lib/stores/auth.test.ts

Content (copy EXACTLY):
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { authStore, isAuthenticated, isAdmin, isBuyer, isVendor, user } from './auth';

describe('Auth Store', () => {
  beforeEach(() => {
    authStore.reset();
    vi.clearAllMocks();
  });

  describe('authStore', () => {
    it('should initialize with null user', () => {
      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    });

    it('should set user and token', () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['buyer'],
        orgId: 'org-123',
      };

      authStore.setUser(mockUser, 'test-token');

      const state = get(authStore);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('test-token');
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(true);
    });

    it('should clear user on logout', () => {
      authStore.setUser(
        { id: '123', name: 'Test', email: 'test@test.com', roles: [], orgId: 'org-1' },
        'token'
      );
      authStore.logout();

      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    });
  });

  describe('derived stores', () => {
    it('isAuthenticated should be false when no user', () => {
      expect(get(isAuthenticated)).toBe(false);
    });

    it('isAuthenticated should be true when user exists', () => {
      authStore.setUser(
        { id: '123', name: 'Test', email: 'test@test.com', roles: [], orgId: 'org-1' },
        'token'
      );
      expect(get(isAuthenticated)).toBe(true);
    });

    it('isAdmin should be true for admin users', () => {
      authStore.setUser(
        { id: '123', name: 'Admin', email: 'admin@test.com', roles: ['admin'], orgId: 'org-1' },
        'token'
      );
      expect(get(isAdmin)).toBe(true);
      expect(get(isBuyer)).toBe(false);
    });

    it('isBuyer should be true for buyer users', () => {
      authStore.setUser(
        { id: '123', name: 'Buyer', email: 'buyer@test.com', roles: ['buyer'], orgId: 'org-1' },
        'token'
      );
      expect(get(isBuyer)).toBe(true);
      expect(get(isVendor)).toBe(false);
    });

    it('isVendor should be true for vendor users', () => {
      authStore.setUser(
        { id: '123', name: 'Vendor', email: 'vendor@test.com', roles: ['vendor'], orgId: 'org-1' },
        'token'
      );
      expect(get(isVendor)).toBe(true);
      expect(get(isBuyer)).toBe(false);
    });

    it('user should return current user', () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['buyer', 'evaluator'],
        orgId: 'org-123',
      };

      authStore.setUser(mockUser, 'token');
      expect(get(user)).toEqual(mockUser);
    });
  });
});

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Unit test file created for auth store

### VERIFICATION:
- [ ] File exists at `src/lib/stores/auth.test.ts`
- [ ] Has tests for authStore
- [ ] Has tests for derived stores

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.18: Create Playwright Configuration

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.18: Create Playwright configuration for E2E tests

Create file: rfq-platform/frontend/playwright.config.ts

Content (copy EXACTLY):
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
};

export default config;

Run: npx playwright install chromium

Respond "✅ DONE" when configuration is created and browser is installed.
```

### EXPECTED OUTPUT:
- Playwright configuration created
- Chromium browser installed

### VERIFICATION:
- [ ] playwright.config.ts exists
- [ ] Chromium browser installed

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.19: Create E2E Test for Login Flow

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.19: Create E2E test for login flow

Create folder: rfq-platform/frontend/e2e

Create file: rfq-platform/frontend/e2e/auth.spec.ts

Content (copy EXACTLY):
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h2')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('.bg-red-100')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=Register now');

    await expect(page).toHaveURL('/register');
    await expect(page.locator('h2')).toContainText('Create Account');
  });

  test('should display register page with all fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('input[type="text"]#name')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]#password')).toBeVisible();
    await expect(page.locator('input[type="password"]#confirmPassword')).toBeVisible();
    await expect(page.locator('input[type="radio"][value="vendor"]')).toBeVisible();
    await expect(page.locator('input[type="radio"][value="buyer"]')).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#name', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('#organizationId', 'org-123');
    await page.fill('#password', 'weak');
    await page.fill('#confirmPassword', 'weak');

    await page.click('button[type="submit"]');

    // Should show password validation error
    await expect(page.locator('text=Password must have')).toBeVisible();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#name', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('#organizationId', 'org-123');
    await page.fill('#password', 'StrongPassword123!');
    await page.fill('#confirmPassword', 'DifferentPassword123!');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- E2E test file created for authentication

### VERIFICATION:
- [ ] e2e/auth.spec.ts exists
- [ ] Has tests for login page
- [ ] Has tests for register page

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.20: Update Package.json Scripts

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.20: Update package.json with test scripts

MODIFY file: rfq-platform/frontend/package.json

Add these scripts to the "scripts" section:
"test": "vitest",
"test:unit": "vitest run",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"coverage": "vitest run --coverage"

The scripts section should now include:
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "prettier --check . && eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "coverage": "vitest run --coverage"
  }
}

Respond "✅ DONE" when file is updated.
```

### EXPECTED OUTPUT:
- package.json updated with test scripts

### VERIFICATION:
- [ ] package.json has test scripts
- [ ] npm test runs vitest
- [ ] npm run test:e2e runs playwright

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.21: Create Docker Configuration

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.21: Create Docker configuration

Create file: rfq-platform/docker-compose.yml

Content (copy EXACTLY):
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: rfq-postgres
    environment:
      POSTGRES_DB: rfq_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: rfq-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    container_name: rfq-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: rfq-backend
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=rfq_platform
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=change-this-in-production-use-long-random-string
      - JWT_REFRESH_SECRET=change-this-too-use-different-long-random-string
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=minioadmin
      - S3_SECRET_KEY=minioadmin
      - S3_BUCKET=rfq-documents
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: rfq-frontend
    environment:
      - VITE_API_URL=http://localhost:3000/api
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  minio_data:

Create file: rfq-platform/backend/Dockerfile

Content (copy EXACTLY):
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "dist/app.js"]

Create file: rfq-platform/frontend/Dockerfile

Content (copy EXACTLY):
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

EXPOSE 5173

CMD ["node", "build"]

Create file: rfq-platform/.dockerignore

Content:
node_modules
.git
.gitignore
*.md
.env
.env.*
!.env.example
dist
build
coverage
.svelte-kit

Respond "✅ DONE" when all Docker files are created.
```

### EXPECTED OUTPUT:
- docker-compose.yml created
- Backend Dockerfile created
- Frontend Dockerfile created
- .dockerignore created

### VERIFICATION:
- [ ] docker-compose.yml exists with all services
- [ ] backend/Dockerfile exists
- [ ] frontend/Dockerfile exists
- [ ] .dockerignore exists

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.22: Create GitIgnore

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.22: Create root .gitignore

Create file: rfq-platform/.gitignore

Content (copy EXACTLY):
# Dependencies
node_modules/

# Build outputs
dist/
build/
.svelte-kit/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/
playwright-report/
test-results/

# Misc
*.tsbuildinfo
.eslintcache
.prettiercache

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- Root .gitignore created

### VERIFICATION:
- [ ] .gitignore exists at rfq-platform root
- [ ] Includes common ignore patterns

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 7.23: Create README

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 7.23: Create project README

Create file: rfq-platform/README.md

Content (copy EXACTLY):
# RFQ Buddy - Online RFQ & Tendering Platform

A comprehensive platform for managing Requests for Quotation (RFQ) and formal Tenders, enabling buyers to float tenders and vendors to submit structured bids.

## Features

- **Tender Management**: Create, publish, and manage RFQs and Tenders
- **Vendor Management**: Vendor registration, approval workflow, and document management
- **Bid Submission**: Structured bid submission with versioning and envelope separation
- **Two-Stage Evaluation**: Technical and commercial evaluation with comparison matrix
- **Award Management**: Full and partial award support
- **Notifications**: Email and in-app notifications for key events
- **Audit Trail**: Complete audit logging for compliance

## Tech Stack

- **Frontend**: SvelteKit 2.x, TypeScript, Tailwind CSS
- **Backend**: Node.js 20, Express, TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Validation**: Zod
- **Testing**: Vitest, Playwright

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 16
- Redis 7
- Docker (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rfq-platform
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   ```

4. Set up the database:
   ```bash
   # Run the schema SQL in PostgreSQL
   psql -U postgres -d rfq_platform -f database/schema.sql
   ```

5. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Using Docker

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO (S3-compatible storage) on ports 9000/9001
- Backend API on port 3000
- Frontend on port 5173

## Testing

### Unit Tests
```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

## Project Structure

```
rfq-platform/
├── backend/           # Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── schemas/
│   │   └── config/
│   └── tests/
├── frontend/          # SvelteKit application
│   ├── src/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── tests/
│   └── e2e/
├── database/          # SQL schema and migrations
└── docker-compose.yml
```

## API Documentation

API endpoints follow RESTful conventions. See the [API Documentation](docs/api.md) for full details.

## License

Proprietary - All rights reserved.

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- README.md created

### VERIFICATION:
- [ ] README.md exists at rfq-platform root
- [ ] Contains setup instructions
- [ ] Contains project structure

### REMARKS:
```
[Agent writes completion notes here]
```

---

# PHASE 7 COMPLETION CHECKLIST

| Task | File | Status |
|------|------|--------|
| 7.1 | Initialize SvelteKit project | ⬜ |
| 7.2 | Install dependencies | ⬜ |
| 7.3 | Configure Tailwind CSS | ⬜ |
| 7.4 | Create root layout | ⬜ |
| 7.5 | Create auth store | ⬜ |
| 7.6 | Create API utility | ⬜ |
| 7.7 | Create environment config | ⬜ |
| 7.8 | Create auth layout group | ⬜ |
| 7.9 | Create login page | ⬜ |
| 7.10 | Create register page | ⬜ |
| 7.11 | Create app layout group | ⬜ |
| 7.12 | Create dashboard page | ⬜ |
| 7.13 | Create tenders list page | ⬜ |
| 7.14 | Create tender detail page | ⬜ |
| 7.15 | Create lib index | ⬜ |
| 7.16 | Create Vitest configuration | ⬜ |
| 7.17 | Create auth store unit test | ⬜ |
| 7.18 | Create Playwright configuration | ⬜ |
| 7.19 | Create E2E auth test | ⬜ |
| 7.20 | Update package.json scripts | ⬜ |
| 7.21 | Create Docker configuration | ⬜ |
| 7.22 | Create .gitignore | ⬜ |
| 7.23 | Create README | ⬜ |

---

## AFTER PHASE 7 COMPLETE

Run these commands to verify:

### Frontend Build
```bash
cd rfq-platform/frontend
npm run build
```

### Unit Tests
```bash
cd rfq-platform/frontend
npm test
```

### E2E Tests (requires backend running)
```bash
cd rfq-platform/frontend
npm run test:e2e
```

### Docker
```bash
cd rfq-platform
docker-compose up -d
docker-compose ps  # All services should be healthy
```

### Full Stack Verification
1. Open http://localhost:5173 - Should see login page
2. Navigate to /register - Should see registration form
3. Backend health check: curl http://localhost:3000/health

**If all verifications pass, the project is complete!**

---

## ADDITIONAL FRONTEND PAGES (OPTIONAL EXTENSIONS)

The following pages can be added as future enhancements:

- `/tenders/new` - Create new tender form
- `/tenders/[id]/edit` - Edit tender form
- `/tenders/[id]/bid` - Bid submission form
- `/tenders/[id]/bids` - View all bids (buyer)
- `/tenders/[id]/comparison` - Comparison matrix
- `/tenders/[id]/evaluate` - Evaluation form
- `/vendors` - Vendor list
- `/vendors/register` - Vendor registration
- `/vendors/[id]` - Vendor profile
- `/profile` - User profile
- `/admin` - Admin panel
- `/exports` - Export management

These follow the same patterns established in the core pages.