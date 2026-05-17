/**
 * ConversationsListScreen — Lista de conversaciones activas.
 * Muestra todas las conversaciones del usuario con el último mensaje,
 * timestamp y badge de mensajes no leídos.
 */

import React, { useCallback, useEffect, useState } from 'react';
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
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import { fetchConversations, Conversation } from '../services/chat.service';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { TOKENS } from '@/core/design-system/tokens';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return 'ahora';
  if (mins < 60)  return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7)   return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function ConversationItem({ item, myUserId }: { item: Conversation; myUserId?: string }) {
  const other = myUserId === item.clientId ? item.provider : item.client;
  const name  = other ? `${other.firstName} ${other.lastName || ''}`.trim() : 'Usuario';
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
            <Text style={styles.itemTime}>{timeAgo(item.lastMessageAt)}</Text>
          </View>

          {item.orderTitle && (
            <Text style={styles.itemOrder} numberOfLines={1}>📋 {item.orderTitle}</Text>
          )}

          <View style={styles.itemFooter}>
            <Text
              style={[styles.itemPreview, hasUnread && styles.itemPreviewBold]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'Conversación iniciada'}
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
  const { profile } = useProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchConversations();
      // Ordenar por último mensaje (más reciente primero)
      setConversations(data.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      ));
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      <BlurView intensity={20} tint="light" style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </BlurView>

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
            <View style={styles.emptyContainer}>
              <MaterialIcons name="chat-bubble-outline" size={64} color="rgba(133,0,33,0.15)" />
              <Text style={styles.emptyTitle}>Sin mensajes todavía</Text>
              <Text style={styles.emptySubtitle}>
                Las conversaciones aparecen cuando cotizás o te contratan.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.emptyButton, pressed && styles.buttonPressed]}
                onPress={() => router.push('/(tabs)/services')}
              >
                <Text style={styles.emptyButtonText}>Explorar servicios</Text>
              </Pressable>
            </View>
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
