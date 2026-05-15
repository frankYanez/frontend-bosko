/**
 * KYCRejectedScreen — Muestra el motivo de rechazo y permite reintentar.
 * POST /kyc/retry — reintento cuando el KYC fue rechazado.
 */

import React from 'react';
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
import { TOKENS } from '@/core/design-system/tokens';

const MAX_ATTEMPTS = 3;

const REJECTION_TIPS = [
  'Asegurate de que el documento no esté cortado ni borroso.',
  'Tomá la foto con buena iluminación, sin reflejos.',
  'La selfie debe mostrar claramente tu rostro y el documento.',
  'Usá el documento vigente, no vencido.',
];

export default function KYCRejectedScreen() {
  const { kyc, retry, loading, error, clearError } = useKYC();

  const attemptCount = kyc?.attemptCount ?? 0;
  const canRetry = attemptCount < MAX_ATTEMPTS;
  const rejectionReason = kyc?.rejectionReason;

  const handleRetry = async () => {
    clearError();
    try {
      await retry();
      router.replace('/(tabs)/profile/kyc/document');
    } catch {
      // Error en contexto
    }
  };

  return (
    <LinearGradient
      colors={['#fff5f5', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Verificación rechazada</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Ícono */}
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
          style={styles.iconWrap}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="cancel" size={52} color="#dc2626" />
          </View>
          <Text style={styles.title}>Verificación rechazada</Text>
          <Text style={styles.subtitle}>
            Tu verificación de identidad no fue aprobada. Revisá el motivo y volvé a intentarlo.
          </Text>
        </MotiView>

        {/* Motivo de rechazo */}
        {!!rejectionReason && (
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
          >
            <BlurView intensity={25} tint="light" style={[styles.card, styles.reasonCard]}>
              <View style={styles.reasonHeader}>
                <MaterialIcons name="info" size={18} color="#dc2626" />
                <Text style={styles.reasonTitle}>Motivo del rechazo</Text>
              </View>
              <Text style={styles.reasonText}>{rejectionReason}</Text>
            </BlurView>
          </MotiView>
        )}

        {/* Tips para el reintento */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>Consejos para el reintento</Text>
            {REJECTION_TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipBullet}>
                  <Text style={styles.tipNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </BlurView>
        </MotiView>

        {/* Contador de intentos */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <BlurView intensity={25} tint="light" style={styles.attemptsCard}>
            <MaterialIcons
              name="refresh"
              size={18}
              color={canRetry ? TOKENS.color.primary : '#dc2626'}
            />
            <Text style={[styles.attemptsText, !canRetry && styles.attemptsExhausted]}>
              {canRetry
                ? `Intentos disponibles: ${MAX_ATTEMPTS - attemptCount} de ${MAX_ATTEMPTS}`
                : 'Agotaste los 3 intentos. Contactá a soporte.'
              }
            </Text>
          </BlurView>
        </MotiView>

        {/* Error del contexto */}
        {!!error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Botones */}
        {canRetry ? (
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 250 }}
          >
            <Pressable
              onPress={handleRetry}
              disabled={loading}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            >
              <LinearGradient
                colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : (
                    <>
                      <MaterialIcons name="refresh" size={20} color="#fff" />
                      <Text style={styles.btnText}>Reintentar verificación</Text>
                    </>
                  )
                }
              </LinearGradient>
            </Pressable>
          </MotiView>
        ) : (
          <BlurView intensity={20} tint="light" style={styles.supportCard}>
            <MaterialIcons name="support-agent" size={24} color={TOKENS.color.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>¿Necesitás ayuda?</Text>
              <Text style={styles.supportText}>
                Contactá a nuestro equipo de soporte con tu problema de verificación.
              </Text>
            </View>
          </BlurView>
        )}

        <Pressable onPress={() => router.replace('/(tabs)/profile/kyc')} style={styles.secondaryRow}>
          <Text style={styles.secondaryText}>Ver estado de verificación</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  iconWrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#dc2626',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 12,
  },
  reasonCard: {
    borderColor: '#fecaca',
    backgroundColor: 'rgba(254,226,226,0.3)',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
  reasonText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(133,0,33,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: TOKENS.color.primary,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: TOKENS.color.sub,
    lineHeight: 18,
  },
  attemptsCard: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attemptsText: {
    fontSize: 13,
    fontWeight: '600',
    color: TOKENS.color.primary,
  },
  attemptsExhausted: { color: '#dc2626' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  supportCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  supportTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.color.text },
  supportText: { fontSize: 13, color: TOKENS.color.sub, lineHeight: 18, marginTop: 2 },
  secondaryRow: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: {
    fontSize: 14,
    color: TOKENS.color.primary,
    fontWeight: '600',
  },
});
