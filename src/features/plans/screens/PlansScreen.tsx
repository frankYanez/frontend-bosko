/**
 * PlansScreen — Planes y suscripciones.
 * Muestra plan actual, planes disponibles, suscribir/cancelar.
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
import { router } from 'expo-router';
import {
  fetchPlans,
  fetchMyPlan,
  subscribe,
  cancelSubscription,
  Plan,
  MyPlan,
} from '@/features/plans/services/plan.service';
import { TOKENS } from '@/core/design-system/tokens';

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

export default function PlansScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [myPlan, setMyPlan] = useState<MyPlan | null | undefined>(undefined); // null = no plan, undefined = loading
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [plansData, myPlanData] = await Promise.all([
        fetchPlans(),
        fetchMyPlan().catch(() => null),
      ]);
      setPlans(plansData);
      setMyPlan(myPlanData);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      await subscribe(planId);
      Alert.alert('¡Suscripción activada!', 'Ahora disfrutás de los beneficios del plan.');
      load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No se pudo procesar la suscripción');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar suscripción',
      '¿Estás seguro? Podés seguir usando el plan hasta el final del período facturado.',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Cancelar', style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription();
              Alert.alert('Suscripción cancelada', 'Al final del período se desactivarán los beneficios.');
              load();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'No se pudo cancelar');
            }
          },
        },
      ],
    );
  };

  const currentPlanId = myPlan?.plan?.id;
  const isSubscribed = !!myPlan;

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      {/* Header */}
      <BlurView intensity={25} tint="light" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Planes</Text>
        <View style={{ width: 40 }} />
      </BlurView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[TOKENS.color.primary]} />
          }
        >
          {/* Current plan banner */}
          {isSubscribed && myPlan && (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14 }}
              style={styles.currentPlanBanner}
            >
              <LinearGradient
                colors={['#850021', '#4A0F20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.currentPlanGrad}
              >
                <MaterialIcons name="workspace-premium" size={28} color="#FFD700" />
                <View style={styles.currentPlanInfo}>
                  <Text style={styles.currentPlanLabel}>Plan actual</Text>
                  <Text style={styles.currentPlanName}>{myPlan.plan.name}</Text>
                  <Text style={styles.currentPlanPeriod}>
                    Vigente hasta {new Date(myPlan.currentPeriodEnd).toLocaleDateString('es-AR')}
                  </Text>
                </View>
                <Pressable onPress={handleCancel} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
              </LinearGradient>
            </MotiView>
          )}

          {/* Free plan note when not subscribed */}
          {!isSubscribed && (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.freeNote}
            >
              <BlurView intensity={25} tint="light" style={styles.freeNoteBlur}>
                <MaterialIcons name="info" size={18} color={TOKENS.color.primary} />
                <Text style={styles.freeNoteText}>
                  Estás en el plan Free. Actualizá para acceder a más beneficios.
                </Text>
              </BlurView>
            </MotiView>
          )}

          {/* Plans grid */}
          {plans.map((plan, idx) => {
            const isCurrent = plan.id === currentPlanId;
            const isPopular = plan.highlighted;

            return (
              <MotiView
                key={plan.id}
                from={{ opacity: 0, translateY: 24 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 16, delay: idx * 100 }}
              >
                <Pressable
                  style={[styles.planCard, isPopular && styles.planCardPopular]}
                  onPress={() => {
                    if (!isCurrent && !subscribing) handleSubscribe(plan.id);
                  }}
                  disabled={isCurrent || !!subscribing}
                >
                  <BlurView intensity={isPopular ? 30 : 20} tint="light" style={styles.planBlur}>
                    {isPopular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Más popular</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <Text style={[styles.planName, isPopular && styles.planNamePopular]}>
                        {plan.name}
                      </Text>
                      <View style={styles.planPrice}>
                        <Text style={[styles.planPriceAmount, isPopular && styles.planPricePopular]}>
                          {formatPrice(plan.price, plan.currency)}
                        </Text>
                        <Text style={styles.planPriceInterval}>/{plan.interval === 'month' ? 'mes' : 'año'}</Text>
                      </View>
                    </View>

                    <Text style={styles.planDescription}>{plan.description}</Text>

                    <View style={styles.featuresList}>
                      {plan.features.map((feature, i) => (
                        <View key={i} style={styles.featureRow}>
                          <MaterialIcons
                            name="check-circle"
                            size={18}
                            color={isPopular ? '#FFD700' : '#16a34a'}
                          />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    {isCurrent ? (
                      <View style={styles.currentBadge}>
                        <MaterialIcons name="check" size={16} color="#fff" />
                        <Text style={styles.currentBadgeText}>Plan actual</Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={isPopular ? ['#FFD700', '#FFA500'] : ['#850021', '#4A0F20']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.subscribeBtn}
                      >
                        {subscribing === plan.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={[
                            styles.subscribeBtnText,
                            isPopular && { color: '#4A0F20' },
                          ]}>
                            {plan.price === 0 ? 'Gratuito' : 'Suscribirse'}
                          </Text>
                        )}
                      </LinearGradient>
                    )}
                  </BlurView>
                </Pressable>
              </MotiView>
            );
          })}
        </ScrollView>
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
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: TOKENS.color.text },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 24, paddingBottom: 40, gap: 20 },
  // Current plan
  currentPlanBanner: { borderRadius: 20, overflow: 'hidden' },
  currentPlanGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  currentPlanInfo: { flex: 1, gap: 2 },
  currentPlanLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,215,0,0.7)', textTransform: 'uppercase' },
  currentPlanName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  currentPlanPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  // Free note
  freeNote: { borderRadius: 16, overflow: 'hidden' },
  freeNoteBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  freeNoteText: { flex: 1, fontSize: 13, color: TOKENS.color.text, lineHeight: 18 },
  // Plan card
  planCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardPopular: {
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  planBlur: { padding: 20, gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularText: { fontSize: 12, fontWeight: '800', color: '#4A0F20' },
  planHeader: { gap: 8 },
  planName: { fontSize: 20, fontWeight: '800', color: TOKENS.color.text },
  planNamePopular: { color: '#850021' },
  planPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  planPriceAmount: { fontSize: 32, fontWeight: '800', color: TOKENS.color.text },
  planPricePopular: { color: '#850021' },
  planPriceInterval: { fontSize: 14, color: TOKENS.color.sub },
  planDescription: { fontSize: 14, color: TOKENS.color.sub, lineHeight: 20 },
  featuresList: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: TOKENS.color.text, flex: 1 },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(22,163,74,0.15)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  currentBadgeText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  subscribeBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  subscribeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
