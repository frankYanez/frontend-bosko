/**
 * PaymentsScreen — Historial de pagos y ganancias.
 * Tabs: Historial (cliente) / Ganancias (proveedor).
 */

import React, { useEffect, useState } from 'react';
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
import { usePayments } from '../state/PaymentContext';
import { PaymentHistoryItem, EarningsItem, PaymentStatus } from '../services/payments';
import { TOKENS } from '@/core/design-system/tokens';

type Tab = 'history' | 'earnings';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pendiente',  color: '#92400e', bg: '#fef3c7' },
  paid:     { label: 'Pagado',     color: '#065f46', bg: '#d1fae5' },
  released: { label: 'Liberado',   color: '#1e40af', bg: '#dbeafe' },
  refunded: { label: 'Reembolsado', color: '#6b21a8', bg: '#f3e8ff' },
  failed:   { label: 'Fallido',    color: '#dc2626', bg: '#fee2e2' },
};

function formatCurrency(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default function PaymentsScreen() {
  const { history, earnings, loading, loadHistory, loadEarnings } = usePayments();
  const [tab, setTab] = useState<Tab>('history');

  useEffect(() => {
    if (tab === 'history') loadHistory().catch(() => {});
    else loadEarnings().catch(() => {});
  }, [tab]);

  const renderHistoryItem = ({ item, index }: { item: PaymentHistoryItem; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 40 }}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => item.orderId && router.push(`/(tabs)/orders/${item.orderId}`)}
      >
        <BlurView intensity={20} tint="light" style={styles.cardBlur}>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <MaterialIcons name="payment" size={22} color={TOKENS.color.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.order?.title ?? `Orden #${item.orderId.slice(-6)}`}
              </Text>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.cardAmount}>{formatCurrency(item.amount, item.currency)}</Text>
              <StatusBadge status={item.status} />
            </View>
          </View>
        </BlurView>
      </Pressable>
    </MotiView>
  );

  const renderEarningsItem = ({ item, index }: { item: EarningsItem; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 40 }}
    >
      <BlurView intensity={20} tint="light" style={styles.earningsCard}>
        <View style={styles.earningsIcon}>
          <MaterialIcons name="attach-money" size={22} color="#065f46" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.order?.title ?? `Orden #${item.orderId.slice(-6)}`}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={styles.earningsAmount}>{formatCurrency(item.amount, item.currency)}</Text>
          <StatusBadge status={item.status} />
        </View>
      </BlurView>
    </MotiView>
  );

  const isEmpty = tab === 'history' ? history.length === 0 : earnings.length === 0;

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
        <Text style={styles.headerTitle}>Pagos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <BlurView intensity={20} tint="light" style={styles.tabBar}>
        {([
          { key: 'history',  label: 'Historial', icon: 'history' },
          { key: 'earnings', label: 'Ganancias', icon: 'trending-up' },
        ] as const).map(t => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <MaterialIcons
              name={t.icon}
              size={18}
              color={tab === t.key ? TOKENS.color.primary : TOKENS.color.sub}
            />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </BlurView>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.primary} size="large" />
        </View>
      )}

      {!loading && isEmpty && (
        <View style={styles.emptyWrap}>
          <MaterialIcons
            name={tab === 'history' ? 'receipt-long' : 'account-balance-wallet'}
            size={56}
            color="rgba(133,0,33,0.2)"
          />
          <Text style={styles.emptyTitle}>
            {tab === 'history' ? 'Sin pagos' : 'Sin ganancias'}
          </Text>
          <Text style={styles.emptyText}>
            {tab === 'history'
              ? 'Tus pagos aparecerán aquí cuando completes una orden.'
              : 'Tus ganancias aparecerán aquí cuando recibas pagos por servicios.'
            }
          </Text>
        </View>
      )}

      {!loading && !isEmpty && tab === 'history' && (
        <FlatList
          data={history}
          keyExtractor={i => i.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadHistory()}
              colors={[TOKENS.color.primary]}
            />
          }
        />
      )}

      {!loading && !isEmpty && tab === 'earnings' && (
        <FlatList
          data={earnings}
          keyExtractor={i => i.id}
          renderItem={renderEarningsItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadEarnings()}
              colors={[TOKENS.color.primary]}
            />
          }
        />
      )}
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: TOKENS.color.text },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabActive: { backgroundColor: 'rgba(133,0,33,0.08)' },
  tabText: { fontSize: 14, fontWeight: '600', color: TOKENS.color.sub },
  tabTextActive: { color: TOKENS.color.primary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  emptyText: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  cardBlur: {
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  earningsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.color.text },
  cardDate: { fontSize: 12, color: TOKENS.color.sub, marginTop: 2 },
  cardAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: TOKENS.color.text,
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065f46',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
