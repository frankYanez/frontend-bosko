/**
 * notifications.service.ts — Servicio de notificaciones.
 * Conectado a /notifications/* y registro de push tokens.
 */

import api from '@/core/api/axiosinstance';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

/** Listar notificaciones — GET /notifications */
export async function fetchNotifications(page = 1, limit = 20): Promise<PaginatedNotifications> {
  const { data } = await api.get<PaginatedNotifications>('/notifications', {
    params: { page, limit },
  });
  return data;
}

/** Contador de no leídas — GET /notifications/unread-count */
export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

/** Marcar notificación como leída — PATCH /notifications/:id/read */
export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

/** Registrar push token — POST /notifications/token */
export async function registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  await api.post('/notifications/token', { token, platform });
}

/** Eliminar push token — DELETE /notifications/token */
export async function deletePushToken(): Promise<void> {
  await api.delete('/notifications/token');
}
