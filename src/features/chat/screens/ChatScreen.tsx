/**
 * ChatScreen — Chat individual ligado a una orden.
 * WebSocket en tiempo real con fallback a polling REST cada 5s.
 * Soporta texto, imágenes y mensajes de audio (estilo WhatsApp).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video, ResizeMode } from 'expo-av';
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
import { useConversations } from '../state/ConversationsContext';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { TOKENS } from '@/core/design-system/tokens';

const POLL_INTERVAL = 10000;
const TYPING_THROTTLE = 2000;

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
        if (status.durationMillis) setDurationMs(status.durationMillis);
        setPositionMs(status.positionMillis ?? 0);
        if (status.didJustFinish) {
          setIsPlaying(false);
          setPositionMs(0);
          soundRef.current?.stopAsync().catch(() => {});
        }
      },
    ).then(({ sound, status }) => {
      if (!mounted) { sound.unloadAsync(); return; }
      soundRef.current = sound;
      if (status.isLoaded && status.durationMillis) setDurationMs(status.durationMillis);
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
  const timeLabel = !loaded || durationMs === 0
    ? '--:--'
    : formatDuration(isPlaying || positionMs > 0 ? positionMs : durationMs);
  const accent = isMine ? '#fff' : TOKENS.color.primary;
  const accentDim = isMine ? 'rgba(255,255,255,0.35)' : 'rgba(133,0,33,0.25)';

  return (
    <View style={[styles.audioBubble]}>
      <Pressable onPress={togglePlay} style={[styles.audioPlayBtn, { borderColor: accentDim }]}>
        <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={22} color={accent} />
      </Pressable>
      <View style={styles.waveform}>
        {WAVE_BARS.map((h, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              { height: h, backgroundColor: progress > 0 && i / WAVE_BARS.length <= progress ? accent : accentDim },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.audioTime, { color: accent }]}>{timeLabel}</Text>
    </View>
  );
}

// ── Burbuja de video ──────────────────────────────────────────────────────────
function VideoBubble({ uri }: { uri: string }) {
  return (
    <Video
      source={{ uri }}
      style={styles.bubbleVideo}
      useNativeControls
      resizeMode={ResizeMode.CONTAIN}
      isLooping={false}
    />
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
    hour: '2-digit', minute: '2-digit',
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
        ) : (msg.messageType === 'file' || msg.messageType === 'image') && msg.mediaUrl && /\.(mp4|mov|avi|webm)$/i.test(msg.mediaUrl) ? (
          <VideoBubble uri={msg.mediaUrl} />
        ) : msg.messageType === 'image' && msg.mediaUrl ? (
          <Image source={{ uri: msg.mediaUrl }} style={styles.bubbleImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {msg.content}
          </Text>
        )}
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
          {timestamp}
          {isMine && (
            <Text style={msg.isRead
              ? styles.statusRead
              : msg.isDelivered
                ? styles.statusDelivered
                : styles.statusSent
            }>
              {msg.isRead || msg.isDelivered ? '  ✓✓' : '  ✓'}
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}

// ── Indicador de grabación (reemplaza el TextInput) ───────────────────────────
function RecordingIndicator({ duration }: { duration: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
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

// ── Typing bubble ─────────────────────────────────────────────────────────────
function TypingBubble() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(480),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingBubbleRow}>
      <View style={styles.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const { authState } = useAuth();
  const { updateLastMessage } = useConversations();
  const insets = useSafeAreaInsets();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socketReady, setSocketReady] = useState(socketService.isConnected);
  const [convId, setConvId] = useState('');

  // Audio — usamos ref para el estado real (evita problemas de closure en onPressOut)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sendingAudio, setSendingAudio] = useState(false);
  const isRecordingRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const convIdRef = useRef<string>('');
  // Ref para acceder a conversation en stopRecording sin dependencia
  const conversationRef = useRef<Conversation | null>(null);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);

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

  const pollBackoffRef = useRef(0);

  const loadMessages = useCallback(async (convId: string) => {
    if (pollBackoffRef.current > Date.now()) return;
    try {
      const data = await fetchMessages(convId);
      setMessages(prev => {
        if (prev.length === data.length && prev[prev.length - 1]?.id === data[data.length - 1]?.id) return prev;
        return data;
      });
      await markAsRead(convId).catch(() => {});
    } catch (err: any) {
      if (err?.response?.status === 429) {
        pollBackoffRef.current = Date.now() + 60_000;
      }
      console.error('Error loading messages:', err);
    }
  }, []);

  useEffect(() => {
    const token = authState.token;
    if (!token) return;
    socketService.connect(token);
    const unsub = socketService.onConnectionChange(setSocketReady);
    return () => unsub();
  }, [authState.token]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!convId || !socketReady) return;
    socketService.joinConversation(convId);
    return () => { socketService.leaveConversation(convId); };
  }, [socketReady, convId]);

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
      setConvId(id);
      await loadMessages(id);
      if (!active) return;
      setLoading(false);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(id), POLL_INTERVAL);
    };
    init();
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadConversation, loadMessages]);


  // ── Audio recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso al micrófono.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current && !recordingRef.current) return;
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    isRecordingRef.current = false;
    setIsRecording(false);

    const recording = recordingRef.current;
    recordingRef.current = null;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      if (!uri) return;
      const convId = conversationRef.current?.id ?? convIdRef.current;
      if (!convId) return;
      setSendingAudio(true);
      const newMsg = await sendAudio(convId, uri);
      setMessages(prev => [...prev, newMsg]);
      updateLastMessage(convId, '🎤 Audio', profile?.id ?? '');
    } catch (err) {
      console.error('Error sending audio:', err);
      Alert.alert('Error', 'No se pudo enviar el audio. Intentá de nuevo.');
    } finally {
      setSendingAudio(false);
      setRecordingDuration(0);
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    if (!isRecordingRef.current && !recordingRef.current) return;
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    isRecordingRef.current = false;
    setIsRecording(false);
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch {}
    recordingRef.current = null;
    setRecordingDuration(0);
  }, []);

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  // ── Media (imagen) ───────────────────────────────────────────────────────
  const handlePickMedia = useCallback(async () => {
    if (!conversation) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.7,
      allowsEditing: false,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    const mimeType = isVideo ? 'video/mp4' : (asset.mimeType ?? 'image/jpeg');
    setSending(true);
    try {
      const newMsg = await sendMedia(conversation.id, asset.uri, mimeType);
      setMessages(prev => [...prev, newMsg]);
      updateLastMessage(conversation.id, isVideo ? '🎥 Video' : '📷 Imagen', profile?.id ?? '');
    } catch (err) {
      console.error('Error sending media:', err);
      Alert.alert('Error', 'No se pudo enviar el archivo.');
    } finally {
      setSending(false);
    }
  }, [conversation]);

  // ── Texto ────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !conversation) return;
    setInput('');
    setSending(true);
    cancelTyping();
    try {
      const newMsg = await sendMsgRest(conversation.id, text);
      setMessages(prev => [...prev, newMsg]);
      updateLastMessage(conversation.id, text, profile?.id ?? '');
    } catch (err) {
      setInput(text);
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

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
      typingTimerRef.current = setTimeout(() => socketService.emitTyping(convIdRef.current, false), TYPING_THROTTLE);
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

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  const myId = profile?.id;
  const other = conversation?.otherParty;
  const otherName = other
    ? `${other.firstName} ${other.lastName || ''}`.trim() || other.username || 'Chat'
    : 'Chat';
  const showMicButton = !input.trim() && !sending && !sendingAudio;

  if (loading) {
    return (
      <View style={[styles.background, styles.centered]}>
        <ActivityIndicator color={TOKENS.color.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
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
                {(other?.firstName || other?.username || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
          </View>
        </View>
        {conversation?.orderId && (
          <Pressable
            hitSlop={12}
            onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: conversation.orderId } })}
          >
            <MaterialIcons name="assignment" size={24} color={TOKENS.color.primary} />
          </Pressable>
        )}
      </BlurView>

      {/* Mensajes */}
      <FlatList
        ref={listRef}
        data={sortedMessages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} myUserId={myId} />}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <MaterialIcons name="chat" size={48} color="rgba(133,0,33,0.15)" />
            <Text style={styles.emptyChatText}>Todavía no hay mensajes</Text>
            <Text style={styles.emptyChatSubtext}>Enviá el primer mensaje para empezar</Text>
          </View>
        }
        style={styles.messagesList}
      />

      {isTyping && <TypingBubble />}

      {/* Input bar — el botón derecho SIEMPRE está montado */}
      <BlurView intensity={25} tint="light" style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputWrapper}>
          {/* Botón izquierdo: galería o cancelar grabación */}
          {isRecording ? (
            <Pressable onPress={cancelRecording} hitSlop={8} style={styles.leftBtn}>
              <MaterialIcons name="delete" size={22} color="#dc2626" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handlePickMedia}
              hitSlop={8}
              style={({ pressed }) => [styles.leftBtn, pressed && { opacity: 0.6 }]}
            >
              <MaterialIcons name="add-photo-alternate" size={22} color={TOKENS.color.sub} />
            </Pressable>
          )}

          {/* Centro: input de texto o indicador de grabación */}
          {isRecording ? (
            <RecordingIndicator duration={recordingDuration} />
          ) : (
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
          )}

          {/*
           * Botón derecho SIEMPRE montado.
           * - Sin texto + sin grabación: 🎤 long press para grabar, onPressOut para parar
           * - Grabando: ⬛ stop (rojo)
           * - Con texto: ➤ enviar
           */}
          <Pressable
            onLongPress={showMicButton && !isRecording ? startRecording : undefined}
            onPressOut={() => { if (isRecordingRef.current) stopRecording(); }}
            onPress={!showMicButton && !isRecording ? handleSend : undefined}
            delayLongPress={150}
            style={({ pressed }) => [
              styles.rightBtn,
              isRecording && styles.rightBtnRecording,
              (!showMicButton && !isRecording && (!input.trim() || sending)) && styles.rightBtnDisabled,
              pressed && styles.rightBtnPressed,
            ]}
          >
            {sendingAudio || (sending && !input.trim()) ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : isRecording ? (
              <MaterialIcons name="stop" size={20} color="#fff" />
            ) : showMicButton ? (
              <MaterialIcons name="mic" size={20} color="#fff" />
            ) : (
              <MaterialIcons name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
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
  backButton: { padding: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.5)' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerName: { fontSize: 16, fontWeight: '700', color: TOKENS.color.text },
  headerOrder: { fontSize: 12, color: TOKENS.color.sub, marginTop: 1 },
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 8, flexGrow: 1 },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, marginVertical: 4,
  },
  systemText: { fontSize: 12, color: TOKENS.color.sub, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  bubbleRowMine: { flexDirection: 'row-reverse' },
  bubbleAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: TOKENS.color.sub,
    alignItems: 'center', justifyContent: 'center',
  },
  bubbleAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 4 },
  bubbleMine: { backgroundColor: TOKENS.color.primary, borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bubbleImage: { width: 200, height: 150, borderRadius: 10 },
  bubbleVideo: { width: 220, height: 160, borderRadius: 10, backgroundColor: '#000' },
  bubbleText: { fontSize: 15, color: TOKENS.color.text, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: TOKENS.color.sub, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  // Audio bubble
  audioBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2, minWidth: 180 },
  audioPlayBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 24 },
  waveBar: { width: 3, borderRadius: 2 },
  audioTime: { fontSize: 11, fontWeight: '600', minWidth: 32 },
  // Input bar
  inputBar: {
    padding: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftBtn: { padding: 4 },
  input: { flex: 1, fontSize: 15, color: TOKENS.color.text, maxHeight: 100, paddingTop: 4 },
  rightBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  rightBtnRecording: { backgroundColor: '#dc2626' },
  rightBtnDisabled: { backgroundColor: '#ccc' },
  rightBtnPressed: { opacity: 0.85, transform: [{ scale: 0.95 }] },
  // Recording
  recordingBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#dc2626' },
  recordingTimer: { fontSize: 15, fontWeight: '700', color: '#dc2626', minWidth: 36 },
  recordingHint: { flex: 1, fontSize: 12, color: TOKENS.color.sub },
  // Empty + typing
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyChatText: { fontSize: 16, fontWeight: '700', color: TOKENS.color.text },
  emptyChatSubtext: { fontSize: 14, color: TOKENS.color.sub },
  typingBubbleRow: { paddingHorizontal: 16, paddingVertical: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: TOKENS.color.sub,
  },
  statusSent:      { color: 'rgba(255,255,255,0.5)' },
  statusDelivered: { color: 'rgba(255,255,255,0.7)' },
  statusRead:      { color: '#60c8ff' },
});
