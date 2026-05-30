import { create } from 'zustand';
import type { Conversation } from '@/features/chat/services/chat.service';

interface ChatState {
  conversations: Conversation[];
  setConversations: (fn: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
  updateLastMessage: (convId: string, content: string, senderId: string) => void;

  unreadTotal: number;
  setUnreadTotal: (n: number) => void;
  incrementUnread: () => void;

  socketReady: boolean;
  setSocketReady: (ready: boolean) => void;

  typingUsers: Record<string, boolean>;
  setTyping: (convId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  setConversations: (fn) =>
    set((state) => ({
      conversations: typeof fn === 'function' ? fn(state.conversations) : fn,
    })),

  updateLastMessage: (convId, content, senderId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: { content, senderId, createdAt: new Date().toISOString() } }
          : c,
      ),
    })),

  unreadTotal: 0,
  setUnreadTotal: (unreadTotal) => set({ unreadTotal }),
  incrementUnread: () => set((state) => ({ unreadTotal: state.unreadTotal + 1 })),

  socketReady: false,
  setSocketReady: (socketReady) => set({ socketReady }),

  typingUsers: {},
  setTyping: (convId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [convId]: isTyping },
    })),
}));

export const useUnreadTotal = () => useChatStore((s) => s.unreadTotal);
export const useConversationsList = () => useChatStore((s) => s.conversations);
export const useSocketReady = () => useChatStore((s) => s.socketReady);
export const useIsTyping = (convId: string) =>
  useChatStore((s) => s.typingUsers[convId] ?? false);
