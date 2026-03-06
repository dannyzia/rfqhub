import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { subscriptionStore } from '../subscription';

describe('Subscription Store', () => {
  it('Initial state', () => {
    const state = get(subscriptionStore);
    expect(state.subscription).toBeNull();
    expect(state.usage).toEqual({});
  });

  it('setSubscription() updates subscription', () => {
    subscriptionStore.setSubscription({ features: ['a'], quotas: { q: 10 } });
    expect(get(subscriptionStore).subscription.features).toContain('a');
  });

  it('checkFeatureAvailable() returns correct value', () => {
    subscriptionStore.setSubscription({ features: ['x'], quotas: {} });
    expect(subscriptionStore.checkFeatureAvailable('x')).toBe(true);
    expect(subscriptionStore.checkFeatureAvailable('y')).toBe(false);
  });

  it('checkQuotaAvailable() & updateUsage()', () => {
    subscriptionStore.setSubscription({ features: [], quotas: { q: 2 } });
    expect(subscriptionStore.checkQuotaAvailable('q')).toBe(true);
    subscriptionStore.updateUsage('q', 1);
    expect(subscriptionStore.checkQuotaAvailable('q')).toBe(true);
    subscriptionStore.updateUsage('q', 1);
    expect(subscriptionStore.checkQuotaAvailable('q')).toBe(false);
  });
});
