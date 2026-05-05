/**
 * NotificationsScreen — Lista de notificaciones del usuario.
 * GET /notifications — con marca de leído por ítem.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { useNotifications } from '../state/NotificationsContext';
import { Notification } from '../services/notifications.service';
import { TOKENS } from '@/core/design-system/tokens';

// Íconos por tipo de notificación
const TYPE_ICON: Record<string, { name: any; color: string; bg: string }> = {
  order_accepted:   { name: 'check-circle',   color: '#065f46', bg: '#d1fae5' },
  order_rejected:   { name: 'cancel',          color: '#dc2626', bg: '#fee2e2' },
  order_started:    { name: 'play-circle',     color: '#1e40af', bg: '#dbeafe' },
  order_completed:  { name: 'done-all',        color: '#065f46', bg: '#d1fae5' },
  order_cancelled:  { name: 'block',           color: '#92400e', bg: '#fef3c7' },
  payment_received: { name: 'attach-money',    color: '#065f46', bg: '#d1fae5' },
  kyc_approved:     { name: 'verified-user',   color: TOKENS.color.primary, bg: 'rgba(133,0,33,0.1)' },
  kyc_rejected:     { name: 'gpp-bad',         color: '#dc2626', bg: '#fee2e2' },
  message:          { name: 'chat-bubble',     color: '#1e40af', bg: '#dbeafe' },
  default:          { name: 'notifications',   color: TOKENS.color.sub, bg: 'rgba(100,100,120,0.1)' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function NotificationItem({
  item,
  onPress,
}: {
  item: Notification;
  onPress: () => void;
}) {
  const cfg = TYPE_ICON[item.type] ?? TYPE_ICON.default;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemWrap,
        !item.read && styles.itemUnread,
        pressed && styles.itemPressed,
      ]}
    >
      <BlurView intensity={20} tint="light" style={styles.itemBlur}>
        {/* Indicador de no leído */}
        {!item.read && <View style={styles.unreadDot} />}

        <View style={[styles.itemIcon, { backgroundColor: cfg.bg }]}>
          <MaterialIcons name={cfg.name} size={22} color={cfg.color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.itemBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </BlurView>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, load, markRead } = useNotifications();

  useEffect(() => {
    load();
  }, []);

  const handlePress = async (item: Notification) => {
    if (!item.read) await markRead(item.id);
    // Navegar según el tipo si hay data relevante
    if (item.data?.orderId) {
      router.push(`/(tabs)/orders/${item.data.orderId}`);
    }
  };

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading && notifications.length === 0 && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.primary} size="large" />
        </View>
      )}

      {!loading && notifications.length === 0 && (
        <View style={styles.emptyWrap}>
          <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14 }}
            style={{ alignItems: 'center', gap: 12 }}
          >
            <MaterialIcons name="notifications-none" size={64} color="rgba(133,0,33,0.2)" />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán tus notificaciones de órdenes, pagos y más.
            </Text>
          </MotiView>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateX: -12 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 280, delay: index * 30 }}
          >
            <NotificationItem item={item} onPress={() => handlePress(item)} />
          </MotiView>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => load()}
            colors={[TOKENS.color.primary]}
          />
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: TOKENS.color.text },
  countBadge: {
    backgroundColor: TOKENS.color.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  emptyText: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 8 },
  itemWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemUnread: {
    shadowOpacity: 0.1,
    elevation: 4,
  },
  itemPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  itemBlur: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TOKENS.color.primary,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.color.text,
    paddingRight: 16,
  },
  itemTitleUnread: { fontWeight: '800' },
  itemBody: {
    fontSize: 13,
    color: TOKENS.color.sub,
    lineHeight: 18,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 11,
    color: 'rgba(107,107,107,0.6)',
    marginTop: 4,
  },
});
