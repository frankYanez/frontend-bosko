/**
 * OrderDetailScreen — Detalle completo de una orden.
 * Muestra el estado, timeline, y acciones disponibles según rol y estado.
 * Acciones: aceptar, rechazar, iniciar, completar, cancelar, disputar.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { router, useLocalSearchParams } from 'expo-router';
import { useOrders } from '../state/OrdersContext';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { Order, OrderStatus } from '../types/orders.types';
import { TOKENS } from '@/core/design-system/tokens';

// Pasos del timeline en orden
const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'pending',     label: 'Solicitud enviada', icon: 'send' },
  { status: 'accepted',    label: 'Aceptada',          icon: 'check-circle' },
  { status: 'in_progress', label: 'En progreso',       icon: 'build' },
  { status: 'completed',   label: 'Completada',        icon: 'verified' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed'];

function Timeline({ currentStatus }: { currentStatus: OrderStatus }) {
  // Si está cancelada o en disputa, no mostramos el timeline normal
  if (currentStatus === 'cancelled' || currentStatus === 'disputed') {
    return (
      <View style={styles.cancelledBanner}>
        <MaterialIcons
          name={currentStatus === 'cancelled' ? 'cancel' : 'gavel'}
          size={20}
          color={currentStatus === 'cancelled' ? '#dc2626' : '#f59e0b'}
        />
        <Text style={[
          styles.cancelledText,
          { color: currentStatus === 'cancelled' ? '#dc2626' : '#f59e0b' }
        ]}>
          {currentStatus === 'cancelled' ? 'Orden cancelada' : 'En disputa — equipo revisando'}
        </Text>
      </View>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <View style={styles.timeline}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;

        return (
          <View key={step.status} style={styles.timelineStep}>
            <View style={styles.timelineLeft}>
              <View style={[
                styles.timelineDot,
                done && styles.timelineDotDone,
                active && styles.timelineDotActive,
              ]}>
                <MaterialIcons
                  name={step.icon as any}
                  size={14}
                  color={done ? '#fff' : 'rgba(133,0,33,0.3)'}
                />
              </View>
              {idx < TIMELINE_STEPS.length - 1 && (
                <View style={[styles.timelineLine, done && idx < currentIdx && styles.timelineLineDone]} />
              )}
            </View>
            <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getOrder, acceptOrder, rejectOrder, startOrder, completeOrder, cancelOrder, disputeOrder } = useOrders();
  const { profile } = useProfile();

  const [order, setOrder] = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!params.id) return;
    const data = await getOrder(params.id);
    setOrder(data);
    setLoading(false);
  }, [getOrder, params.id]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // Determinar si el usuario autenticado es el cliente o el proveedor
  const isClient   = profile?.id === order?.clientId;
  const isProvider = profile?.id === order?.providerId;

  const runAction = async (label: string, action: () => Promise<void>) => {
    setActionLoading(label);
    try {
      await action();
      await loadOrder(); // Refresca los datos
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Error al ${label.toLowerCase()}`;
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setActionLoading(null);
    }
  };

  const promptAndRun = (label: string, placeholder: string, action: (reason: string) => Promise<void>) => {
    Alert.prompt(
      label,
      placeholder,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: reason => {
            if (!reason?.trim()) return;
            runAction(label, () => action(reason.trim()));
          },
        },
      ],
      'plain-text',
    );
  };

  if (loading) {
    return (
      <View style={[styles.background, styles.centered]}>
        <ActivityIndicator color={TOKENS.color.primary} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.background, styles.centered]}>
        <Text style={styles.notFoundText}>No se encontró la orden</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadOrder}
            tintColor={TOKENS.color.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Detalle de orden</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Nombre del servicio + fecha */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.serviceName}>{order.service?.title || 'Servicio'}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={14} color={TOKENS.color.sub} />
              <Text style={styles.metaText}>{date}</Text>
            </View>
            {order.address && (
              <View style={styles.metaRow}>
                <MaterialIcons name="location-on" size={14} color={TOKENS.color.sub} />
                <Text style={styles.metaText}>{order.address}</Text>
              </View>
            )}
          </BlurView>
        </MotiView>

        {/* Timeline */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 80 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.sectionTitle}>Estado de la orden</Text>
            <Timeline currentStatus={order.status} />
          </BlurView>
        </MotiView>

        {/* Mensaje del cliente */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 160 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.sectionTitle}>Mensaje</Text>
            <Text style={styles.messageText}>{order.clientMessage}</Text>
          </BlurView>
        </MotiView>

        {/* Botón ir al chat */}
        <Pressable
          style={({ pressed }) => [styles.chatButton, pressed && styles.buttonPressed]}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: order.id } })}
        >
          <MaterialIcons name="chat" size={18} color={TOKENS.color.primary} />
          <Text style={styles.chatButtonText}>Abrir chat de esta orden</Text>
          <MaterialIcons name="chevron-right" size={18} color={TOKENS.color.primary} />
        </Pressable>

        {/* Acciones según rol y estado */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 240 }}
          style={styles.actionsContainer}
        >
          {/* PROVEEDOR: puede aceptar o rechazar si pending */}
          {isProvider && order.status === 'pending' && (
            <>
              <ActionButton
                label="Aceptar"
                icon="check"
                color="#16a34a"
                loading={actionLoading === 'Aceptar'}
                onPress={() => runAction('Aceptar', () => acceptOrder(order.id))}
              />
              <ActionButton
                label="Rechazar"
                icon="close"
                color="#dc2626"
                secondary
                loading={actionLoading === 'Rechazar'}
                onPress={() => promptAndRun(
                  'Rechazar orden',
                  'Ingresá el motivo del rechazo',
                  reason => rejectOrder(order.id, { reason }),
                )}
              />
            </>
          )}

          {/* PROVEEDOR: puede iniciar si accepted */}
          {isProvider && order.status === 'accepted' && (
            <ActionButton
              label="Iniciar trabajo"
              icon="play-arrow"
              color={TOKENS.color.primary}
              loading={actionLoading === 'Iniciar trabajo'}
              onPress={() => runAction('Iniciar trabajo', () => startOrder(order.id))}
            />
          )}

          {/* PROVEEDOR: puede completar si in_progress */}
          {isProvider && order.status === 'in_progress' && (
            <ActionButton
              label="Marcar como completado"
              icon="check-circle"
              color="#16a34a"
              loading={actionLoading === 'Marcar como completado'}
              onPress={() => runAction('Marcar como completado', () => completeOrder(order.id))}
            />
          )}

          {/* CLIENTE: puede cancelar si pending o accepted */}
          {isClient && ['pending', 'accepted'].includes(order.status) && (
            <ActionButton
              label="Cancelar orden"
              icon="cancel"
              color="#dc2626"
              secondary
              loading={actionLoading === 'Cancelar orden'}
              onPress={() => promptAndRun(
                'Cancelar orden',
                'Ingresá el motivo de la cancelación',
                reason => cancelOrder(order.id, { reason }),
              )}
            />
          )}

          {/* CLIENTE o PROVEEDOR: puede disputar si in_progress o completed */}
          {(isClient || isProvider) && ['in_progress', 'completed'].includes(order.status) && (
            <ActionButton
              label="Abrir disputa"
              icon="gavel"
              color="#f59e0b"
              secondary
              loading={actionLoading === 'Abrir disputa'}
              onPress={() => promptAndRun(
                'Abrir disputa',
                'Describí el problema para que el equipo de Bosko pueda ayudarte',
                reason => disputeOrder(order.id, { reason }),
              )}
            />
          )}
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

function ActionButton({
  label, icon, color, secondary, loading, onPress
}: {
  label: string;
  icon: any;
  color: string;
  secondary?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        secondary ? { borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' } : { backgroundColor: color },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator color={secondary ? color : '#fff'} size="small" />
        : (
          <>
            <MaterialIcons name={icon} size={18} color={secondary ? color : '#fff'} />
            <Text style={[styles.actionButtonText, secondary && { color }]}>{label}</Text>
          </>
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  // Timeline
  timeline: { gap: 0 },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(133,0,33,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: TOKENS.color.primary,
  },
  timelineDotActive: {
    backgroundColor: TOKENS.color.primary,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(133,0,33,0.1)',
    marginTop: 2,
  },
  timelineLineDone: {
    backgroundColor: TOKENS.color.primary,
  },
  timelineLabel: {
    fontSize: 14,
    color: TOKENS.color.sub,
    paddingTop: 6,
  },
  timelineLabelDone: {
    color: TOKENS.color.text,
    fontWeight: '600',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(133,0,33,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(133,0,33,0.15)',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.color.primary,
    flex: 1,
  },
  actionsContainer: { gap: 10 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    minHeight: 52,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  notFoundText: {
    fontSize: 17,
    color: TOKENS.color.sub,
    marginBottom: 16,
  },
  backLink: { padding: 8 },
  backLinkText: {
    fontSize: 15,
    color: TOKENS.color.primary,
    fontWeight: '600',
  },
});
