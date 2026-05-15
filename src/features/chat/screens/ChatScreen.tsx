/**
 * ChatScreen — Chat individual ligado a una orden.
 * WebSocket en tiempo real con fallback a polling REST cada 5s.
 * Muestra indicador de escritura y mensajes del sistema.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  fetchConversationByOrder,
  fetchMessages,
  sendMessage as sendMsgRest,
  sendMedia,
  markAsRead,
  Message,
  Conversation,
} from '../services/chat.service';
import { socketService } from '../services/socket.service';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { TOKENS } from '@/core/design-system/tokens';

const POLL_INTERVAL = 5000;
const TYPING_THROTTLE = 2000; // ms entre emits de typing

// Burbuja de mensaje individual
function MessageBubble({ msg, myUserId }: { msg: Message; myUserId?: string }) {
  const isMine = msg.senderId === myUserId;

  // Mensajes del sistema (cambios de estado de la orden) se centran
  if (msg.messageType === 'system_event') {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemText}>{msg.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      {!isMine && (
        <View style={styles.bubbleAvatar}>
          <Text style={styles.bubbleAvatarText}>
            {(msg.sender?.firstName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
          {msg.content}
        </Text>
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
          {new Date(msg.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          {isMine && (
            <Text>  {msg.isRead ? '✓✓' : '✓'}</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const { authState } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // el otro está escribiendo
  const [socketReady, setSocketReady] = useState(false);

  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const convIdRef = useRef<string>('');

  const loadConversation = useCallback(async () => {
    if (!params.id) return;
    try {
      const conv = await fetchConversationByOrder(params.id);
      setConversation(conv);
      return conv.id;
    } catch {
      return params.id;
    }
  }, [params.id]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const data = await fetchMessages(convId);
      setMessages(prev => {
        if (prev.length === data.length && prev[prev.length - 1]?.id === data[data.length - 1]?.id) {
          return prev;
        }
        return data;
      });
      await markAsRead(convId).catch(() => {});
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, []);

  // ── WebSocket setup ──────────────────────────────────────────────
  useEffect(() => {
    const token = authState.token;
    if (!token) return;

    socketService.connect(token);

    const unsubConnection = socketService.onConnectionChange(setSocketReady);
    return () => unsubConnection();
  }, [authState.token]);

  // Join conversation room when we have convId
  useEffect(() => {
    const id = convIdRef.current;
    if (!id || !socketReady) return;

    socketService.joinConversation(id);

    return () => {
      socketService.leaveConversation(id);
    };
  }, [socketReady, convIdRef.current]);

  // Listen for incoming messages via socket
  useEffect(() => {
    const unsubMsg = socketService.onMessageReceived((msg) => {
      // Only accept messages for current conversation
      if (msg.conversationId !== convIdRef.current) return;
      setMessages(prev => {
        // Avoid dupes
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => unsubMsg();
  }, []);

  // ── Init: load conversation + start polling fallback ────────────
  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoading(true);
      const id = await loadConversation();
      if (!id || !active) { setLoading(false); return; }
      convIdRef.current = id;
      await loadMessages(id);
      if (!active) return;
      setLoading(false);

      // Polling fallback (only when socket not ready)
      pollRef.current = setInterval(() => {
        if (!socketService.isConnected) {
          loadMessages(id);
        }
      }, POLL_INTERVAL);
    };

    init();

    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadConversation, loadMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // ── Send media ──────────────────────────────────────────────────
  const handlePickMedia = useCallback(async () => {
    if (!conversation) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setSending(true);
    try {
      const newMsg = await sendMedia(conversation.id, uri);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Error sending media:', err);
    } finally {
      setSending(false);
    }
  }, [conversation]);

  // ── Send message ─────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !conversation) return;

    setInput('');
    setSending(true);
    cancelTyping();

    try {
      if (socketService.isConnected) {
        socketService.sendMessage(conversation.id, text);
        // Optimistically add message — socket will confirm
        const optimistic: Message = {
          id: `temp-${Date.now()}`,
          conversationId: conversation.id,
          senderId: profile?.id || '',
          content: text,
          messageType: 'text',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
      } else {
        const newMsg = await sendMsgRest(conversation.id, text);
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (err) {
      setInput(text);
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Typing indicator ─────────────────────────────────────────────
  const cancelTyping = useCallback(() => {
    socketService.emitTyping(convIdRef.current, false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    lastTypingEmitRef.current = 0;
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setInput(text);

    if (!socketService.isConnected || !convIdRef.current) return;

    const now = Date.now();
    if (text.trim() && now - lastTypingEmitRef.current > TYPING_THROTTLE) {
      socketService.emitTyping(convIdRef.current, true);
      lastTypingEmitRef.current = now;

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketService.emitTyping(convIdRef.current, false);
      }, TYPING_THROTTLE);
    }

    if (!text.trim()) {
      cancelTyping();
    }
  }, [cancelTyping]);

  // Listen for typing indicator from other user
  useEffect(() => {
    const unsubTyping = socketService.onTypingIndicator((data) => {
      if (data.userId === profile?.id) return;
      setIsTyping(data.isTyping);
    });
    return () => unsubTyping();
  }, [profile?.id]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  // Derive header info
  const myId   = profile?.id;
  const other  = myId === conversation?.clientId ? conversation?.provider : conversation?.client;
  const otherName = other ? `${other.firstName} ${other.lastName || ''}`.trim() : 'Chat';

  if (loading) {
    return (
      <View style={[styles.background, styles.centered]}>
        <ActivityIndicator color={TOKENS.color.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.background}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <BlurView intensity={25} tint="light" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
        </Pressable>

        <View style={styles.headerInfo}>
          {other?.avatarUrl ? (
            <Image source={{ uri: other.avatarUrl }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {(other?.firstName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
            {conversation?.orderTitle && (
              <Text style={styles.headerOrder} numberOfLines={1}>
                📋 {conversation.orderTitle}
              </Text>
            )}
          </View>
        </View>

        {/* Ir a la orden */}
        {conversation?.orderId && (
          <Pressable
            hitSlop={12}
            onPress={() => router.push({
              pathname: '/(tabs)/orders/[id]',
              params: { id: conversation.orderId },
            })}
          >
            <MaterialIcons name="assignment" size={24} color={TOKENS.color.primary} />
          </Pressable>
        )}
      </BlurView>

      {/* Lista de mensajes */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageBubble msg={item} myUserId={myId} />
        )}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <MaterialIcons name="chat" size={48} color="rgba(133,0,33,0.15)" />
            <Text style={styles.emptyChatText}>Todavía no hay mensajes</Text>
            <Text style={styles.emptyChatSubtext}>Enviá el primer mensaje para empezar</Text>
          </View>
        }
        style={styles.messagesList}
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingBar}>
          <Text style={styles.typingText}>{otherName} está escribiendo...</Text>
        </View>
      )}

      {/* Input */}
      <BlurView intensity={25} tint="light" style={styles.inputBar}>
        <View style={styles.inputWrapper}>
          <Pressable
            onPress={handlePickMedia}
            hitSlop={8}
            style={({ pressed }) => [styles.mediaBtn, pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons name="add-photo-alternate" size={22} color={TOKENS.color.sub} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={handleInputChange}
            placeholder="Escribí un mensaje..."
            placeholderTextColor={TOKENS.color.sub}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || sending) && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <MaterialIcons name="send" size={20} color="#fff" />
            }
          </Pressable>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f8f5ff',
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
  },
  backButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  headerOrder: {
    fontSize: 12,
    color: TOKENS.color.sub,
    marginTop: 1,
  },
  messagesList: { flex: 1 },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    flexGrow: 1,
  },
  // Sistema
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginVertical: 4,
  },
  systemText: {
    fontSize: 12,
    color: TOKENS.color.sub,
    textAlign: 'center',
  },
  // Burbujas
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleRowMine: {
    flexDirection: 'row-reverse',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TOKENS.color.sub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: TOKENS.color.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 15,
    color: TOKENS.color.text,
    lineHeight: 20,
  },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: {
    fontSize: 10,
    color: TOKENS.color.sub,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  // Input
  inputBar: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.color.text,
    maxHeight: 100,
    paddingTop: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaBtn: {
    padding: 6,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonPressed: { opacity: 0.85, transform: [{ scale: 0.95 }] },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  // Typing indicator
  typingBar: {
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 12,
    color: TOKENS.color.sub,
    fontStyle: 'italic',
  },
});
