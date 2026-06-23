/**
 * socket.service.ts — WebSocket para chat en tiempo real.
 * Usa socket.io-client para conectar con el backend NestJS.
 *
 * Eventos documentados en endpoints.md sección 13.
 * Conexión requiere JWT en handshake (auth.token o query ?token=).
 *
 * Uso:
 *   import { socketService } from './socket.service';
 *   socketService.connect(token);
 *   socketService.joinConversation('conv-id');
 *   socketService.onMessageReceived(msg => { ... });
 */

import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/core/config/env';
import { Message } from './chat.service';

// Socket.io uses the origin only — the path suffix (/api/v1) would be treated as a namespace
const SOCKET_URL = API_URL.replace(/\/api\/v\d+.*$/, '');

type MessageCallback = (message: Message) => void;
type TypingCallback = (data: { userId: string; isTyping: boolean }) => void;
type ConnectionCallback = (connected: boolean) => void;
type MessagesReadCallback = (data: { conversationId: string; readBy: string }) => void;

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: Set<MessageCallback> = new Set();
  private typingHandlers: Set<TypingCallback> = new Set();
  private connectionHandlers: Set<ConnectionCallback> = new Set();
  private readHandlers: Set<MessagesReadCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /** Conectar al WebSocket con JWT */
  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.connectionHandlers.forEach(cb => cb(true));
    });

    this.socket.on('disconnect', () => {
      this.connectionHandlers.forEach(cb => cb(false));
    });

    this.socket.on('message_received', (msg: Message) => {
      this.messageHandlers.forEach(cb => cb(msg));
    });

    this.socket.on('new_message_notification', (msg: Message) => {
      this.messageHandlers.forEach(cb => cb(msg));
    });

    this.socket.on('typing_indicator', (data: { userId: string; isTyping: boolean }) => {
      this.typingHandlers.forEach(cb => cb(data));
    });

    this.socket.on('messages_read', (data: { conversationId: string; readBy: string }) => {
      this.readHandlers.forEach(cb => cb(data));
    });

    this.socket.on('connect_error', (err) => {
      this.reconnectAttempts++;
      if (err.message === 'Invalid namespace') {
        this.socket?.disconnect();
      }
    });
  }

  /** Desconectar */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.connectionHandlers.clear();
    this.readHandlers.clear();
  }

  /** Unirse a una sala de conversación */
  joinConversation(conversationId: string): void {
    this.socket?.emit('join_conversation', { conversationId });
  }

  /** Salir de una sala */
  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  /** Enviar mensaje en tiempo real */
  sendMessage(conversationId: string, content: string, type = 'text'): void {
    this.socket?.emit('send_message', { conversationId, content, type });
  }

  /** Notificar estado de escritura */
  emitTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit('typing_indicator', { conversationId, isTyping });
  }

  /** Suscribirse a mensajes entrantes */
  onMessageReceived(cb: MessageCallback): () => void {
    this.messageHandlers.add(cb);
    return () => this.messageHandlers.delete(cb);
  }

  /** Suscribirse a indicadores de escritura */
  onTypingIndicator(cb: TypingCallback): () => void {
    this.typingHandlers.add(cb);
    return () => this.typingHandlers.delete(cb);
  }

  /** Suscribirse a cambios de conexión */
  onConnectionChange(cb: ConnectionCallback): () => void {
    this.connectionHandlers.add(cb);
    return () => this.connectionHandlers.delete(cb);
  }

  /** Suscribirse a confirmaciones de lectura del otro participante */
  onMessagesRead(cb: MessagesReadCallback): () => void {
    this.readHandlers.add(cb);
    return () => this.readHandlers.delete(cb);
  }
}

export const socketService = new SocketService();
