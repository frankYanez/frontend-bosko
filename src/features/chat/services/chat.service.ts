/**
 * Servicio de chat.
 * Encapsula las llamadas al backend para el módulo de mensajería.
 * Endpoints documentados en endpoints.md sección 5.
 * El chat siempre está ligado a una orden — no hay mensajes directos libres.
 */

import api from '@/core/api/axiosinstance';

export interface ChatParticipant {
  id: string;
  firstName: string;
  lastName?: string;
  username: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  messageType: 'text' | 'image' | 'audio' | 'file' | 'system_event';
  isDelivered: boolean;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: ChatParticipant;
}

export interface OtherParty {
  id: string;
  username: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string | null;
  role: string;
  isVerified: boolean;
  rating?: number | null;
  reviewsCount?: number;
}

export interface Conversation {
  id: string;
  orderId: string;
  otherParty: OtherParty;
  lastMessage?: { content: string; senderId: string; createdAt: string | Date } | null;
  unreadCount: number;
  createdAt: string | Date;
}

/** Listar todas las conversaciones del usuario autenticado */
export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>('/conversations');
  return data;
}

/** Obtener la conversación asociada a una orden */
export async function fetchConversationByOrder(orderId: string): Promise<Conversation> {
  const { data } = await api.get<Conversation>(`/conversations/${orderId}`);
  return data;
}

/** Obtener mensajes de una conversación (paginados) */
export async function fetchMessages(
  conversationId: string,
  params?: { page?: number; limit?: number },
): Promise<Message[]> {
  const { data } = await api.get<any>(`/conversations/${conversationId}/messages`, { params });
  return (data as any)?.data ?? (Array.isArray(data) ? data : []);
}

/** Enviar un mensaje de texto */
export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { data } = await api.post<Message>(`/conversations/${conversationId}/messages`, {
    content,
    type: 'text',
  });
  return data;
}

/** Marcar conversación como leída */
export async function markAsRead(conversationId: string): Promise<void> {
  await api.patch(`/conversations/${conversationId}/read`);
}

/** Enviar un archivo/imagen */
export async function sendMedia(conversationId: string, fileUri: string): Promise<Message> {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, type: 'image/jpeg', name: 'media.jpg' } as any);

  const { data } = await api.post<Message>(`/conversations/${conversationId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Enviar un mensaje de audio */
export async function sendAudio(conversationId: string, fileUri: string): Promise<Message> {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, type: 'audio/m4a', name: 'audio.m4a' } as any);

  const { data } = await api.post<Message>(`/conversations/${conversationId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
