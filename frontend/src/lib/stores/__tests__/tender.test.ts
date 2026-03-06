import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { tenderStore } from '../tender';

describe('Tender Store', () => {
  it('Initial state', () => {
    const state = get(tenderStore);
    expect(state.tenders).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.currentTender).toBeNull();
    expect(state.error).toBeNull();
  });

  it('setTenders() updates tenders list', () => {
    tenderStore.setTenders([{ id: '1' }]);
    expect(get(tenderStore).tenders).toHaveLength(1);
  });

  it('addTender() adds tender to list', () => {
    tenderStore.setTenders([]);
    tenderStore.addTender({ id: '2' });
    expect(get(tenderStore).tenders).toEqual([{ id: '2' }]);
  });

  it('updateTender() updates existing tender', () => {
    tenderStore.setTenders([{ id: '3', name: 'old' }]);
    tenderStore.updateTender({ id: '3', name: 'new' });
    expect(get(tenderStore).tenders[0].name).toBe('new');
  });

  it('removeTender() removes tender', () => {
    tenderStore.setTenders([{ id: '4' }]);
    tenderStore.removeTender('4');
    expect(get(tenderStore).tenders).toEqual([]);
  });

  it('setCurrentTender() sets current tender', () => {
    tenderStore.setCurrentTender({ id: '5' });
    expect(get(tenderStore).currentTender).toEqual({ id: '5' });
  });

  it('clearCurrentTender() clears current tender', () => {
    tenderStore.clearCurrentTender();
    expect(get(tenderStore).currentTender).toBeNull();
  });

  it('setLoading() updates loading state', () => {
    tenderStore.setLoading(true);
    expect(get(tenderStore).loading).toBe(true);
  });

  it('setError() / clearError()', () => {
    tenderStore.setError('oops');
    expect(get(tenderStore).error).toBe('oops');
    tenderStore.clearError();
    expect(get(tenderStore).error).toBeNull();
  });
});
