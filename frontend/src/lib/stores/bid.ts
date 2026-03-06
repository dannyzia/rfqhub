import { writable } from 'svelte/store';

type Bid = any;

function createBidStore() {
  const { subscribe, update } = writable<{
    bids: Bid[];
    currentBid: Bid | null;
    loading: boolean;
    error: any;
  }>({ bids: [], currentBid: null, loading: false, error: null });

  return {
    subscribe,
    setBids: (bids: Bid[]) => update(s => ({ ...s, bids })),
    setCurrentBid: (bid: Bid | null) => update(s => ({ ...s, currentBid: bid })),
    updateBidItem: (item: any) => update(s => {
      if (!s.currentBid) return s;
      const updatedItems = s.currentBid.items.map((i: any) =>
        i.id === item.id ? item : i,
      );
      return { ...s, currentBid: { ...s.currentBid, items: updatedItems } };
    }),
    addBidItem: (item: any) => update(s => {
      if (!s.currentBid) return s;
      return {
        ...s,
        currentBid: { ...s.currentBid, items: [...(s.currentBid.items || []), item] },
      };
    }),
    removeBidItem: (itemId: string) => update(s => {
      if (!s.currentBid) return s;
      return {
        ...s,
        currentBid: {
          ...s.currentBid,
          items: s.currentBid.items.filter((i: any) => i.id !== itemId),
        },
      };
    }),
    calculateTotal: () => update(s => {
      if (!s.currentBid) return s;
      const total = (s.currentBid.items || []).reduce(
        (sum: number, i: any) => sum + (i.amount || 0),
        0,
      );
      return { ...s, currentBid: { ...s.currentBid, total } };
    }),
    validateBid: () => update(s => {
      if (!s.currentBid) return s;
      const valid = !!s.currentBid.items && s.currentBid.items.length > 0;
      return { ...s, currentBid: { ...s.currentBid, valid } };
    }),
  };
}

export const bidStore = createBidStore();
