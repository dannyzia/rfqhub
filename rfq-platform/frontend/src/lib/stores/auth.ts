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
  organizationType?: 'government' | 'non-government';  // NEW
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
  isLoading: false,
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

  authStore.setLoading(true);
  try {
    const response = await api.get<{ user: User }>('/auth/me');
    authStore.setUser(response.user, token);
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    authStore.logout();
  } finally {
    authStore.setLoading(false);
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
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  phoneNumber?: string;
  role: string;
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
