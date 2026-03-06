import { writable } from 'svelte/store';

type Subscription = any;

function createSubscriptionStore() {
  const { subscribe, update } = writable<{
    subscription: Subscription | null;
    usage: Record<string, number>;
  }>({ subscription: null, usage: {} });

  return {
    subscribe,
    setSubscription: (sub: Subscription | null) => update(s => ({ ...s, subscription: sub })),
    checkFeatureAvailable: (feature: string) => {
      let available = false;
      update(s => {
        available = s.subscription?.features?.includes(feature);
        return s;
      });
      return available;
    },
    checkQuotaAvailable: (quota: string) => {
      let available = false;
      update(s => {
        available = (s.usage[quota] || 0) < (s.subscription?.quotas?.[quota] || 0);
        return s;
      });
      return available;
    },
    updateUsage: (quota: string, amount: number) => update(s => {
      return { ...s, usage: { ...s.usage, [quota]: (s.usage[quota] || 0) + amount } };
    }),
  };
}

export const subscriptionStore = createSubscriptionStore();
