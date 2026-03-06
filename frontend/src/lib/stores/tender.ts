import { writable } from 'svelte/store';

type Tender = any;

function createTenderStore() {
  const { subscribe, update } = writable<{
    tenders: Tender[];
    currentTender: Tender | null;
    loading: boolean;
    error: any;
  }>({ tenders: [], currentTender: null, loading: false, error: null });

  return {
    subscribe,
    setTenders: (tenders: Tender[]) => update(s => ({ ...s, tenders })),
    addTender: (tender: Tender) => update(s => ({ ...s, tenders: [...s.tenders, tender] })),
    updateTender: (tender: Tender) => update(s => ({
      ...s,
      tenders: s.tenders.map(t => (t.id === tender.id ? tender : t)),
    })),
    removeTender: (id: string) => update(s => ({
      ...s,
      tenders: s.tenders.filter(t => t.id !== id),
    })),
    setCurrentTender: (tender: Tender | null) => update(s => ({ ...s, currentTender: tender })),
    clearCurrentTender: () => update(s => ({ ...s, currentTender: null })),
    setLoading: (b: boolean) => update(s => ({ ...s, loading: b })),
    setError: (e: any) => update(s => ({ ...s, error: e })),
    clearError: () => update(s => ({ ...s, error: null })),
  };
}

export const tenderStore = createTenderStore();
