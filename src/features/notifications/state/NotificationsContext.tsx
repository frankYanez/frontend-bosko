/**
 * NotificationsContext — Estado global de notificaciones.
 * Soporta iOS y Android (FCM via google-services.json).
 * En Expo Go las notificaciones push están deshabilitadas (SDK 53+).
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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

// Expo Go no soporta push remotas desde SDK 53 — saltear todo lo nativo
const isExpoGo = Constants.appOwnership === 'expo';

// Notificaciones en foreground: solo en dev build
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    } as Notifications.NotificationBehavior),
  });
}

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

  const notifListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!token || isExpoGo) return;
    registerDevicePushToken().catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchUnreadCount().then(setUnreadCount).catch(() => {});
  }, [token]);

  // Actualiza unread count cuando llega una notificación con la app en primer plano
  // Solo en dev build — Expo Go no soporta listeners de notificaciones remotas
  useEffect(() => {
    if (isExpoGo) return;
    notifListenerRef.current = Notifications.addNotificationReceivedListener(() => {
      fetchUnreadCount().then(setUnreadCount).catch(() => {});
    });
    return () => notifListenerRef.current?.remove();
  }, []);

  const registerDevicePushToken = async () => {
    if (!Device.isDevice) return; // Simuladores no reciben push

    // Android: configurar canal de notificaciones
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Bosko',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#850021',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    if (!projectId) return;

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
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
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
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
