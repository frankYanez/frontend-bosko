import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/features/notifications/services/notifications.service';

export function useNotificationsQuery(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(page),
    queryFn: () => fetchNotifications(page),
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: QUERY_KEYS.unreadCount,
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      qc.setQueryData(QUERY_KEYS.notifications(1), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n: any) => (n.id === id ? { ...n, read: true } : n)),
        };
      });
      qc.setQueryData(QUERY_KEYS.unreadCount, (old: number) =>
        Math.max(0, (old ?? 0) - 1),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.setQueryData(QUERY_KEYS.unreadCount, 0);
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.notifications()[0]] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.notifications()[0]] });
    },
  });
}
