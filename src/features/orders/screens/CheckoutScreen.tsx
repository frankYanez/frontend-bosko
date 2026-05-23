import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useOrders } from '../state/OrdersContext';
import { usePayments } from '@/features/payments/state/PaymentContext';
import type { Order } from '../types/orders.types';

const C = {
  primary: '#850021',
  dark:    '#4A0F20',
  bg:      '#F7F7FA',
  card:    '#FFFFFF',
  text:    '#1A1A1A',
  sub:     '#6B7280',
  border:  '#EDEDF0',
  green:   '#16A34A',
  greenBg: '#F0FFF4',
};

function formatCurrency(amount?: number) {
  if (!amount) return '—';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; text: string }) {
  return (
    <View style={s.infoRow}>
      <MaterialIcons name={icon} size={15} color={C.sub} />
      <Text style={s.infoText}>{text}</Text>
    </View>
  );
}

export function CheckoutScreen() {
  const insets  = useSafeAreaInsets();
  const params  = useLocalSearchParams<{ orderId: string }>();
  const { getOrder } = useOrders();
  const { initiate } = usePayments();

  const [order, setOrder]     = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);

  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      if (!params.orderId) return;
      const data = await getOrder(params.orderId);
      setOrder(data);
      setLoading(false);
      Animated.parallel([
        Animated.timing(fade,   { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    })();
  }, [params.orderId]);

  const handlePay = useCallback(async () => {
    if (!order?.id) return;
    setPaying(true);
    try {
      await initiate(order.id);
      router.replace({
        pathname: '/(tabs)/orders/payment-success',
        params: {
          orderId:     order.id,
          amount:      String(order.agreedPrice ?? 0),
          serviceName: order.service?.title ?? 'Servicio',
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No se pudo procesar el pago. Intentá de nuevo.');
    } finally {
      setPaying(false);
    }
  }, [order, initiate]);

  if (loading) {
    return (
      <View style={[s.root, s.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[s.root, s.centered, { paddingTop: insets.top }]}>
        <Text style={s.errorText}>No se encontró la orden</Text>
        <Pressable onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkText}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const providerName = order.provider
    ? `${order.provider.firstName} ${order.provider.lastName ?? ''}`.trim()
    : 'Proveedor';

  const subtotal = order.agreedPrice ?? 0;
  const fee      = Math.round(subtotal * 0.05);
  const total    = subtotal + fee;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.headerTitle}>Confirmar pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }] }}>

          {/* ── Resumen del servicio ──────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>SERVICIO</Text>
            <View style={s.serviceRow}>
              {order.service?.thumbnail ? (
                <Image source={{ uri: order.service.thumbnail }} style={s.thumb} contentFit="cover" />
              ) : (
                <LinearGradient colors={[C.dark, C.primary]} style={s.thumbFallback}>
                  <Ionicons name="construct" size={20} color="#fff" />
                </LinearGradient>
              )}
              <View style={s.serviceInfo}>
                <Text style={s.serviceName}>{order.service?.title ?? 'Servicio'}</Text>
                <Text style={s.serviceProvider}>por {providerName}</Text>
              </View>
            </View>

            <View style={s.divider} />

            {order.scheduledDate && (
              <InfoRow icon="event" text={formatDate(order.scheduledDate) ?? ''} />
            )}
            {order.address && (
              <InfoRow icon="location-on" text={order.address} />
            )}
            {order.clientMessage ? (
              <InfoRow icon="notes" text={order.clientMessage} />
            ) : null}
          </View>

          {/* ── Desglose de precio ───────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>RESUMEN DE PAGO</Text>

            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Subtotal</Text>
              <Text style={s.priceValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={s.priceRow}>
              <View style={s.feeRow}>
                <Text style={s.priceLabel}>Comisión de servicio</Text>
                <View style={s.feeBadge}>
                  <Text style={s.feeBadgeText}>5%</Text>
                </View>
              </View>
              <Text style={s.priceValue}>{formatCurrency(fee)}</Text>
            </View>

            <View style={s.totalDivider} />

            <View style={s.priceRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          {/* ── Método ──────────────────────────────────────────────────── */}
          <View style={[s.card, s.methodCard]}>
            <View style={s.methodIcon}>
              <Ionicons name="shield-checkmark" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.methodTitle}>Pago seguro Bosko</Text>
              <Text style={s.methodSub}>El monto queda en garantía hasta que el trabajo sea completado</Text>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── CTA fija ────────────────────────────────────────────────────── */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={s.footerTotal}>{formatCurrency(total)}</Text>
        <Animated.View style={{ transform: [{ scale: btnScale }], flex: 1 }}>
          <Pressable
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
            onPress={handlePay}
            disabled={paying}
            style={s.payBtnWrap}
          >
            <LinearGradient
              colors={[C.dark, C.primary, '#c0002f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.payBtn}
            >
              {paying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={16} color="#fff" />
                  <Text style={s.payBtnText}>Confirmar y pagar</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },

  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },

  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  serviceRow:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb:          { width: 54, height: 54, borderRadius: 12 },
  thumbFallback:  { width: 54, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  serviceInfo:    { flex: 1, gap: 3 },
  serviceName:    { fontSize: 16, fontWeight: '700', color: C.text },
  serviceProvider:{ fontSize: 13, color: C.sub },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: C.sub, flex: 1 },

  priceRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 14, color: C.sub },
  priceValue: { fontSize: 14, color: C.text, fontWeight: '500' },

  feeRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feeBadge:  { backgroundColor: '#FFF0F3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  feeBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  totalDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  totalLabel:   { fontSize: 16, fontWeight: '700', color: C.text },
  totalValue:   { fontSize: 18, fontWeight: '800', color: C.primary },

  methodCard:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  methodIcon:  { width: 44, height: 44, borderRadius: 13, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center' },
  methodTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  methodSub:   { fontSize: 12, color: C.sub, lineHeight: 17, marginTop: 2 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  footerTotal: { fontSize: 20, fontWeight: '800', color: C.text, minWidth: 100 },
  payBtnWrap:  { flex: 1 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  payBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  errorText:    { fontSize: 15, color: C.sub, marginBottom: 12 },
  backLink:     { paddingHorizontal: 16, paddingVertical: 10 },
  backLinkText: { color: C.primary, fontWeight: '600' },
});
