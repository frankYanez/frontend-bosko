import { create } from 'zustand';

interface NotificationsUIState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useNotificationsUIStore = create<NotificationsUIState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export const useNotificationsOpen = () => useNotificationsUIStore((s) => s.isOpen);
export const openNotifications = () => useNotificationsUIStore.getState().open();
export const closeNotifications = () => useNotificationsUIStore.getState().close();
