import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { bidStore } from '../bid';

describe('Bid Store', () => {
  it('Initial state', () => {
    const state = get(bidStore);
    expect(state.bids).toEqual([]);
    expect(state.currentBid).toBeNull();
  });

  it('setBids() updates bids list', () => {
    bidStore.setBids([{ id: '1' }]);
    expect(get(bidStore).bids).toHaveLength(1);
  });

  it('setCurrentBid() sets current bid', () => {
    bidStore.setCurrentBid({ id: '2', items: [] });
    expect(get(bidStore).currentBid?.id).toBe('2');
  });

  it('addBidItem() / updateBidItem() / removeBidItem()', () => {
    bidStore.setCurrentBid({ id: '3', items: [] });
    bidStore.addBidItem({ id: 'item1', amount: 100 });
    expect(get(bidStore).currentBid?.items).toHaveLength(1);
    bidStore.updateBidItem({ id: 'item1', amount: 200 });
    expect(get(bidStore).currentBid?.items[0].amount).toBe(200);
    bidStore.removeBidItem('item1');
    expect(get(bidStore).currentBid?.items).toEqual([]);
  });

  it('calculateTotal() computes total', () => {
    bidStore.setCurrentBid({ id: '4', items: [{ id: 'a', amount: 50 }, { id: 'b', amount: 25 }] });
    bidStore.calculateTotal();
    expect(get(bidStore).currentBid?.total).toBe(75);
  });

  it('validateBid() marks validity', () => {
    bidStore.setCurrentBid({ id: '5', items: [] });
    bidStore.validateBid();
    expect(get(bidStore).currentBid?.valid).toBe(false);
    bidStore.addBidItem({ id: 'i', amount: 10 });
    bidStore.validateBid();
    expect(get(bidStore).currentBid?.valid).toBe(true);
  });
});
