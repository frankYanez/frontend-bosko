import React, { createContext, useCallback, useContext, useState } from 'react';
import { Conversation } from '../services/chat.service';

type ConversationsContextType = {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  updateLastMessage: (convId: string, content: string, senderId: string) => void;
};

const ConversationsContext = createContext<ConversationsContextType>({
  conversations: [],
  setConversations: () => {},
  updateLastMessage: () => {},
});

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const updateLastMessage = useCallback((convId: string, content: string, senderId: string) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === convId
          ? { ...c, lastMessage: { content, senderId, createdAt: new Date().toISOString() } }
          : c,
      ),
    );
  }, []);

  return (
    <ConversationsContext.Provider value={{ conversations, setConversations, updateLastMessage }}>
      {children}
    </ConversationsContext.Provider>
  );
}

export const useConversations = () => useContext(ConversationsContext);
