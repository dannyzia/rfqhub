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
