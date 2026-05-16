/**
 * KYCStatusScreen — Hub central del proceso KYC.
 * Muestra el estado actual y el CTA apropiado según el estado.
 * Actúa como router: si no hay KYC → intro, si está rechazado → KYCRejectedScreen.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import { useKYC } from '../state/KYCContext';
import { KYCStatus } from '../types/kyc.types';
import { TOKENS } from '@/core/design-system/tokens';

type StatusUIConfig = {
  title: string;
  description: string;
  color: string;
  bg: string;
  icon: any;
};

const STATUS_UI: Record<KYCStatus, StatusUIConfig> = {
  not_started: {
    title: 'Verificación no iniciada',
    description: 'Para publicar servicios y crear órdenes necesitás verificar tu identidad.',
    color: TOKENS.color.primary,
    bg: 'rgba(133,0,33,0.08)',
    icon: 'shield',
  },
  in_progress: {
    title: 'En revisión',
    description: 'Tu documentación está siendo revisada. Te notificamos cuando esté listo.',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    icon: 'hourglass-empty',
  },
  pending: {
    title: 'En revisión',
    description: 'Tu documentación está siendo revisada. Te notificamos cuando esté listo.',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    icon: 'hourglass-empty',
  },
  approved: {
    title: '¡Verificado!',
    description: 'Tu identidad fue verificada exitosamente. Podés publicar servicios y crear órdenes.',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    icon: 'verified',
  },
  rejected: {
    title: 'Verificación rechazada',
    description: 'Hubo un problema con tus documentos. Podés volver a intentarlo.',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    icon: 'cancel',
  },
  declined: {
    title: 'Verificación rechazada',
    description: 'Hubo un problema con tus documentos. Podés volver a intentarlo.',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    icon: 'cancel',
  },
  failed: {
    title: 'Error en verificación',
    description: 'Hubo un error técnico. Podés volver a intentarlo.',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    icon: 'error-outline',
  },
  expired: {
    title: 'Verificación vencida',
    description: 'Tu verificación expiró. Necesitás iniciar el proceso nuevamente.',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
    icon: 'timer-off',
  },
};

export default function KYCStatusScreen() {
  const { verification, loading, refresh } = useKYC();

  useEffect(() => { refresh(); }, [refresh]);

  if (loading && !verification) {
    return (
      <View style={[styles.background, styles.centered]}>
        <ActivityIndicator color={TOKENS.color.primary} size="large" />
      </View>
    );
  }

  const rawStatus = (verification?.status?.toLowerCase() ?? 'not_started') as KYCStatus;
  // pending sin inquiryId significa que nunca se inició el proceso
  const status: KYCStatus = (rawStatus === 'pending' && !verification?.inquiryId) ? 'not_started' : rawStatus;
  const ui = STATUS_UI[status] ?? STATUS_UI['not_started'];

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Verificación de identidad</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Estado visual */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 100 }}
          style={styles.statusContainer}
        >
          <View style={[styles.iconCircle, { backgroundColor: ui.bg }]}>
            <MaterialIcons name={ui.icon} size={48} color={ui.color} />
          </View>
          <Text style={[styles.statusTitle, { color: ui.color }]}>{ui.title}</Text>
          <Text style={styles.statusDescription}>{ui.description}</Text>
        </MotiView>

        {/* Beneficios (solo si no está aprobado) */}
        {status !== 'approved' && status !== 'in_progress' && status !== 'pending' && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <BlurView intensity={25} tint="light" style={styles.card}>
              <Text style={styles.cardTitle}>¿Por qué verificar tu identidad?</Text>
              {[
                { icon: 'work', text: 'Publicar servicios en el marketplace' },
                { icon: 'shopping-cart', text: 'Contratar servicios de otros proveedores' },
                { icon: 'verified-user', text: 'Badge de verificado en tu perfil' },
                { icon: 'security', text: 'Mayor confianza de los clientes' },
              ].map(item => (
                <View key={item.icon} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <MaterialIcons name={item.icon as any} size={16} color={TOKENS.color.primary} />
                  </View>
                  <Text style={styles.benefitText}>{item.text}</Text>
                </View>
              ))}
            </BlurView>
          </MotiView>
        )}

        {/* Intentos restantes (si hay verificación) */}
        {verification && (
          <BlurView intensity={20} tint="light" style={styles.attemptsCard}>
            <MaterialIcons name="info-outline" size={16} color={TOKENS.color.sub} />
            <Text style={styles.attemptsText}>
              Intentos utilizados: {verification.attemptCount} de 3
            </Text>
          </BlurView>
        )}

        {/* CTAs según estado */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          style={styles.ctaContainer}
        >
          {(status === 'not_started' || status === 'expired' || status === 'failed') && (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => router.push('/(tabs)/profile/kyc/intro')}
            >
              <LinearGradient
                colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Iniciar verificación</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          )}

          {(status === 'in_progress' || status === 'pending') && (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => router.push('/(tabs)/profile/kyc/intro')}
            >
              <LinearGradient
                colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Continuar verificación</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          )}

          {(status === 'rejected' || status === 'declined') && verification && verification.attemptCount < verification.maxAttempts && (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => router.push('/(tabs)/profile/kyc/intro')}
            >
              <LinearGradient
                colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Reintentar verificación</Text>
                <MaterialIcons name="refresh" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          )}

          {status === 'approved' && (
            <Pressable
              style={({ pressed }) => [styles.successButton, pressed && styles.buttonPressed]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <MaterialIcons name="home" size={18} color="#16a34a" />
              <Text style={styles.successButtonText}>Ir a mi perfil</Text>
            </Pressable>
          )}
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  statusContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 15,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: TOKENS.color.text,
    flex: 1,
  },
  attemptsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  attemptsText: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  ctaContainer: { gap: 12 },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderWidth: 1.5,
    borderColor: '#16a34a',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
});
