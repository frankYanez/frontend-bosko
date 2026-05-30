/**
 * ConversationsListScreen — Lista de conversaciones activas.
 * Muestra todas las conversaciones del usuario con el último mensaje,
 * timestamp y badge de mensajes no leídos.
 */

import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { EmptyState } from '@/core/components/EmptyState';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import { fetchConversations, Conversation } from '../services/chat.service';
import { useProfile } from '@/hooks/queries/useProfileQuery';
import { useChatStore, useConversationsList } from '@/stores/chat.store';
import { TOKENS } from '@/core/design-system/tokens';

function formatLastMessage(content?: string | null): string {
  if (!content) return 'Conversación iniciada';
  if (content.startsWith('🎤') || content.startsWith('🖼') || content.startsWith('📷') ||
      content.startsWith('🎥') || content.startsWith('📎')) return content;
  if (content.startsWith('http://') || content.startsWith('https://')) {
    if (/\.(mp3|m4a|aac|ogg|wav)/i.test(content)) return '🎤 Mensaje de voz';
    if (/\.(mp4|mov|avi|webm)/i.test(content)) return '🎥 Video';
    if (/\.(pdf|doc|docx|xls|xlsx)/i.test(content)) return '📎 Documento';
    if (/\.(jpg|jpeg|png|gif|webp)/i.test(content)) return '📷 Foto';
    return '📎 Archivo';
  }
  return content;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function ConversationItem({ item }: { item: Conversation; myUserId?: string }) {
  const other = item.otherParty;
  const name = other
    ? `${other.firstName} ${other.lastName || ''}`.trim() || 'Usuario'
    : 'Usuario';
  const hasUnread = item.unreadCount > 0;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.orderId } })}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {other?.avatarUrl ? (
            <Image source={{ uri: other.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(other?.firstName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {hasUnread && <View style={styles.onlineDot} />}
        </View>

        {/* Contenido */}
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, hasUnread && styles.itemNameBold]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.itemTime}>
              {item.lastMessage?.createdAt ? timeAgo(String(item.lastMessage.createdAt)) : ''}
            </Text>
          </View>

          <View style={styles.itemFooter}>
            <Text
              style={[styles.itemPreview, hasUnread && styles.itemPreviewBold]}
              numberOfLines={1}
            >
              {formatLastMessage(item.lastMessage?.content)}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 9 ? '9+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ConversationsListScreen() {
  const { data: profile } = useProfile();
  const conversations = useConversationsList();
  const setConversations = useChatStore((s) => s.setConversations);
  const setUnreadTotal = useChatStore((s) => s.setUnreadTotal);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchConversations();
      const sorted = data.sort((a, b) => {
        const tA = new Date(String(a.lastMessage?.createdAt ?? a.createdAt)).getTime();
        const tB = new Date(String(b.lastMessage?.createdAt ?? b.createdAt)).getTime();
        return tB - tA;
      });
      // Preserve optimistic lastMessage if it's newer than what the backend returned
      setConversations(prev =>
        sorted.map(fresh => {
          const existing = prev.find(c => c.id === fresh.id);
          if (existing?.lastMessage && fresh.lastMessage) {
            const existingTime = new Date(String(existing.lastMessage.createdAt)).getTime();
            const freshTime = new Date(String(fresh.lastMessage.createdAt)).getTime();
            if (existingTime > freshTime) return { ...fresh, lastMessage: existing.lastMessage };
          }
          return fresh;
        }),
      );
      setUnreadTotal(data.reduce((acc, c) => acc + c.unreadCount, 0));
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          color={TOKENS.color.primary}
          size="large"
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ConversationItem item={item} myUserId={profile?.id} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="Sin mensajes todavía"
              subtitle="Las conversaciones aparecen cuando cotizás un servicio o te contratan como prestador."
              cta={{ label: 'Explorar servicios', onPress: () => router.push('/(tabs)/services') }}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={TOKENS.color.primary}
              colors={[TOKENS.color.primary]}
            />
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: TOKENS.color.text,
  },
  headerBadge: {
    backgroundColor: TOKENS.color.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  loader: { flex: 1 },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  itemPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  itemContent: { flex: 1, gap: 3 },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: TOKENS.color.text,
    flex: 1,
  },
  itemNameBold: { fontWeight: '700' },
  itemTime: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  itemOrder: {
    fontSize: 12,
    color: TOKENS.color.primary,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemPreview: {
    fontSize: 13,
    color: TOKENS.color.sub,
    flex: 1,
  },
  itemPreviewBold: { color: TOKENS.color.text, fontWeight: '600' },
  unreadBadge: {
    backgroundColor: TOKENS.color.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: TOKENS.color.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonPressed: { opacity: 0.85 },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
