/**
 * NotificationsContext — Estado global de notificaciones.
 * Carga notificaciones, marca como leídas y registra push token.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

let Notifications: any = null;
let Device: any = null;

if (Platform.OS === 'ios') {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch {}
}
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  registerPushToken,
  Notification,
} from '../services/notifications.service';
import { useAuth } from '@/features/auth/state/AuthContext';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string;
  load: (page?: number) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearError: () => void;
}

const NotificationsContext = createContext<NotificationsState | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  const token = authState.token;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Registrar push token cuando el usuario está autenticado
  useEffect(() => {
    if (!token) return;
    registerDevicePushToken().catch(() => {});
  }, [token]);

  // Cargar contador al autenticar
  useEffect(() => {
    if (!token) return;
    fetchUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [token]);

  const registerDevicePushToken = async () => {
    if (!Notifications || !Device || !Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
    const platform = Platform.OS as 'ios' | 'android';
    await registerPushToken(pushToken, platform);
  };

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchNotifications(page);
      setNotifications(page === 1 ? res.data : prev => [...prev, ...res.data]);
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cargar notificaciones.');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const remove = async (id: string) => {
    const wasUnread = notifications.find(n => n.id === id)?.read === false;
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = async () => {
    await clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        load,
        markRead,
        markAllRead,
        remove,
        clearAll,
        clearError: () => setError(''),
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
