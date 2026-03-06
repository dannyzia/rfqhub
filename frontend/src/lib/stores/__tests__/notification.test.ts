import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { notificationStore } from '../notification';

describe('Notification Store', () => {
  it('Initial state', () => {
    expect(get(notificationStore).notifications).toEqual([]);
    expect(get(notificationStore).unreadCount).toBe(0);
  });

  it('setNotifications() updates notifications', () => {
    notificationStore.setNotifications([{ id: '1', read: false }]);
    expect(get(notificationStore).notifications).toHaveLength(1);
    expect(get(notificationStore).unreadCount).toBe(1);
  });

  it('addNotification() adds one', () => {
    notificationStore.setNotifications([]);
    notificationStore.addNotification({ id: '2', read: false });
    expect(get(notificationStore).notifications).toHaveLength(1);
  });

  it('markAsRead() marks single read', () => {
    notificationStore.setNotifications([{ id: '3', read: false }]);
    notificationStore.markAsRead('3');
    expect(get(notificationStore).notifications[0].read).toBe(true);
    expect(get(notificationStore).unreadCount).toBe(0);
  });

  it('markAllAsRead() marks all', () => {
    notificationStore.setNotifications([
      { id: '4', read: false },
      { id: '5', read: false },
    ]);
    notificationStore.markAllAsRead();
    expect(get(notificationStore).notifications.every((n: any) => n.read)).toBe(true);
  });

  it('removeNotification() removes one', () => {
    notificationStore.setNotifications([{ id: '6', read: false }]);
    notificationStore.removeNotification('6');
    expect(get(notificationStore).notifications).toEqual([]);
  });
});
