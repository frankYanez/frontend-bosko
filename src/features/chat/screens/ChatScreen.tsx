/**
 * ChatScreen — Chat individual ligado a una orden.
 * WebSocket en tiempo real con fallback a polling REST cada 5s.
 * Soporta texto, imágenes y mensajes de audio (estilo WhatsApp).
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
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  fetchConversationByOrder,
  fetchMessages,
  sendMessage as sendMsgRest,
  sendMedia,
  sendAudio,
  markAsRead,
  Message,
  Conversation,
} from '../services/chat.service';
import { socketService } from '../services/socket.service';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { TOKENS } from '@/core/design-system/tokens';

const POLL_INTERVAL = 5000;
const TYPING_THROTTLE = 2000;

// Opciones de grabación — m4a en iOS y Android
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
};

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Barras de forma de onda decorativas (alturas en dp)
const WAVE_BARS = [6, 10, 16, 8, 20, 12, 22, 10, 18, 8, 14, 10, 12, 20, 8, 10, 18, 12, 8, 16];

// ── Burbuja de audio ──────────────────────────────────────────────────────────
function AudioBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!msg.mediaUrl) return;
    let mounted = true;

    Audio.Sound.createAsync(
      { uri: msg.mediaUrl },
      { shouldPlay: false },
      (status) => {
        if (!mounted || !status.isLoaded) return;
        setIsPlaying(status.isPlaying ?? false);
        setDurationMs(status.durationMillis ?? 0);
        setPositionMs(status.positionMillis ?? 0);
        if (status.didJustFinish) {
          setIsPlaying(false);
          setPositionMs(0);
          soundRef.current?.setPositionAsync(0);
        }
      },
    ).then(({ sound }) => {
      if (!mounted) { sound.unloadAsync(); return; }
      soundRef.current = sound;
      setLoaded(true);
    }).catch(() => {});

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [msg.mediaUrl]);

  const togglePlay = async () => {
    if (!soundRef.current || !loaded) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const timeLabel = formatDuration(isPlaying || positionMs > 0 ? positionMs : durationMs);

  const accent = isMine ? '#fff' : TOKENS.color.primary;
  const accentDim = isMine ? 'rgba(255,255,255,0.35)' : 'rgba(133,0,33,0.25)';

  return (
    <View style={[styles.audioBubble, isMine ? styles.audioBubbleMine : styles.audioBubbleOther]}>
      <Pressable onPress={togglePlay} style={[styles.audioPlayBtn, { borderColor: accentDim }]}>
        <MaterialIcons
          name={isPlaying ? 'pause' : 'play-arrow'}
          size={22}
          color={accent}
        />
      </Pressable>

      {/* Waveform bars */}
      <View style={styles.waveform}>
        {WAVE_BARS.map((h, i) => {
          const filled = progress > 0 && i / WAVE_BARS.length <= progress;
          return (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: h,
                  backgroundColor: filled ? accent : accentDim,
                },
              ]}
            />
          );
        })}
      </View>

      <Text style={[styles.audioTime, { color: accent }]}>{timeLabel}</Text>
    </View>
  );
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────────
function MessageBubble({ msg, myUserId }: { msg: Message; myUserId?: string }) {
  const isMine = msg.senderId === myUserId;

  if (msg.messageType === 'system_event') {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemText}>{msg.content}</Text>
      </View>
    );
  }

  const timestamp = new Date(msg.createdAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
        {msg.messageType === 'audio' ? (
          <AudioBubble msg={msg} isMine={isMine} />
        ) : msg.messageType === 'image' && msg.mediaUrl ? (
          <Image source={{ uri: msg.mediaUrl }} style={styles.bubbleImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {msg.content}
          </Text>
        )}
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
          {timestamp}
          {isMine && <Text>  {msg.isRead ? '✓✓' : '✓'}</Text>}
        </Text>
      </View>
    </View>
  );
}

// ── Indicador de grabación ────────────────────────────────────────────────────
function RecordingIndicator({ duration }: { duration: number }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.recordingBar}>
      <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.recordingTimer}>{formatDuration(duration * 1000)}</Text>
      <Text style={styles.recordingHint}>Suelta para enviar</Text>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const { authState } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sendingAudio, setSendingAudio] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (
          prev.length === data.length &&
          prev[prev.length - 1]?.id === data[data.length - 1]?.id
        ) return prev;
        return data;
      });
      await markAsRead(convId).catch(() => {});
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, []);

  // WebSocket
  useEffect(() => {
    const token = authState.token;
    if (!token) return;
    socketService.connect(token);
    const unsub = socketService.onConnectionChange(setSocketReady);
    return () => unsub();
  }, [authState.token]);

  useEffect(() => {
    const id = convIdRef.current;
    if (!id || !socketReady) return;
    socketService.joinConversation(id);
    return () => { socketService.leaveConversation(id); };
  }, [socketReady, convIdRef.current]);

  useEffect(() => {
    const unsub = socketService.onMessageReceived((msg) => {
      if (msg.conversationId !== convIdRef.current) return;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => unsub();
  }, []);

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
      pollRef.current = setInterval(() => {
        if (!socketService.isConnected) loadMessages(id);
      }, POLL_INTERVAL);
    };
    init();
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadConversation, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // ── Audio recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!conversation) return;
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso al micrófono.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  }, [conversation]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    setIsRecording(false);

    const recording = recordingRef.current;
    recordingRef.current = null;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      if (!uri || !conversation) return;
      setSendingAudio(true);
      const newMsg = await sendAudio(conversation.id, uri);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Error sending audio:', err);
      Alert.alert('Error', 'No se pudo enviar el audio. Intentá de nuevo.');
    } finally {
      setSendingAudio(false);
      setRecordingDuration(0);
    }
  }, [conversation]);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch {}
    recordingRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // ── Send media (imagen) ──────────────────────────────────────────────────
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
    setSending(true);
    try {
      const newMsg = await sendMedia(conversation.id, result.assets[0].uri);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Error sending media:', err);
    } finally {
      setSending(false);
    }
  }, [conversation]);

  // ── Send text ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !conversation) return;
    setInput('');
    setSending(true);
    cancelTyping();
    try {
      if (socketService.isConnected) {
        socketService.sendMessage(conversation.id, text);
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

  // ── Typing indicator ─────────────────────────────────────────────────────
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
    if (!text.trim()) cancelTyping();
  }, [cancelTyping]);

  useEffect(() => {
    const unsub = socketService.onTypingIndicator((data) => {
      if (data.userId === profile?.id) return;
      setIsTyping(data.isTyping);
    });
    return () => unsub();
  }, [profile?.id]);

  useEffect(() => {
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, []);

  const myId = profile?.id;
  const other = myId === conversation?.clientId ? conversation?.provider : conversation?.client;
  const otherName = other ? `${other.firstName} ${other.lastName || ''}`.trim() : 'Chat';

  if (loading) {
    return (
      <View style={[styles.background, styles.centered]}>
        <ActivityIndicator color={TOKENS.color.primary} size="large" />
      </View>
    );
  }

  const showMicButton = !input.trim() && !sending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.background}
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
              <Text style={styles.headerOrder} numberOfLines={1}>📋 {conversation.orderTitle}</Text>
            )}
          </View>
        </View>

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

      {/* Mensajes */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} myUserId={myId} />}
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

      {/* Typing */}
      {isTyping && (
        <View style={styles.typingBar}>
          <Text style={styles.typingText}>{otherName} está escribiendo...</Text>
        </View>
      )}

      {/* Input bar */}
      <BlurView intensity={25} tint="light" style={styles.inputBar}>
        {isRecording ? (
          <View style={styles.inputWrapper}>
            <Pressable onPress={cancelRecording} hitSlop={8} style={styles.cancelRecordBtn}>
              <MaterialIcons name="delete" size={20} color="#dc2626" />
            </Pressable>
            <RecordingIndicator duration={recordingDuration} />
            <Pressable
              onPress={stopRecording}
              style={[styles.sendButton, { backgroundColor: '#dc2626' }]}
            >
              {sendingAudio
                ? <ActivityIndicator color="#fff" size="small" />
                : <MaterialIcons name="stop" size={20} color="#fff" />
              }
            </Pressable>
          </View>
        ) : (
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

            {showMicButton ? (
              <Pressable
                onLongPress={startRecording}
                onPressOut={() => { if (isRecording) stopRecording(); }}
                delayLongPress={200}
                style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}
              >
                <MaterialIcons name="mic" size={20} color="#fff" />
              </Pressable>
            ) : (
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
            )}
          </View>
        )}
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#f8f5ff' },
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
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerName: { fontSize: 16, fontWeight: '700', color: TOKENS.color.text },
  headerOrder: { fontSize: 12, color: TOKENS.color.sub, marginTop: 1 },
  messagesList: { flex: 1 },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    flexGrow: 1,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginVertical: 4,
  },
  systemText: { fontSize: 12, color: TOKENS.color.sub, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  bubbleRowMine: { flexDirection: 'row-reverse' },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TOKENS.color.sub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
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
  bubbleImage: { width: 200, height: 150, borderRadius: 10 },
  bubbleText: { fontSize: 15, color: TOKENS.color.text, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: TOKENS.color.sub, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },

  // Audio bubble
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    minWidth: 180,
  },
  audioBubbleMine: {},
  audioBubbleOther: {},
  audioPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  waveBar: { width: 3, borderRadius: 2 },
  audioTime: { fontSize: 11, fontWeight: '600', minWidth: 30 },

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
    alignItems: 'center',
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
  sendButtonDisabled: { backgroundColor: '#ccc' },
  sendButtonPressed: { opacity: 0.85, transform: [{ scale: 0.95 }] },
  mediaBtn: { padding: 6 },
  cancelRecordBtn: { padding: 6 },

  // Recording state
  recordingBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  recordingTimer: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
    minWidth: 36,
  },
  recordingHint: {
    flex: 1,
    fontSize: 13,
    color: TOKENS.color.sub,
  },

  // Empty
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyChatText: { fontSize: 16, fontWeight: '700', color: TOKENS.color.text },
  emptyChatSubtext: { fontSize: 14, color: TOKENS.color.sub },

  // Typing
  typingBar: { paddingHorizontal: 24, paddingVertical: 6 },
  typingText: { fontSize: 12, color: TOKENS.color.sub, fontStyle: 'italic' },
});
