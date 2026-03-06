import { writable, derived } from "svelte/store";

type Notification = any;

function createNotificationStore() {
  const _notifications = writable<Notification[]>([]);

  const store = derived(_notifications, ($notifications) => ({
    notifications: $notifications,
    unreadCount: $notifications.filter((n: Notification) => !n.read).length,
  }));

  return {
    subscribe: store.subscribe,
    setNotifications: (notifs: Notification[]) => _notifications.set(notifs),
    addNotification: (notif: Notification) =>
      _notifications.update((ns) => [...ns, notif]),
    markAsRead: (id: string) =>
      _notifications.update((ns) =>
        ns.map((n: Notification) => (n.id === id ? { ...n, read: true } : n)),
      ),
    markAllAsRead: () =>
      _notifications.update((ns) =>
        ns.map((n: Notification) => ({ ...n, read: true })),
      ),
    removeNotification: (id: string) =>
      _notifications.update((ns) =>
        ns.filter((n: Notification) => n.id !== id),
      ),
  };
}

export const notificationStore = createNotificationStore();
