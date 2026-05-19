import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useKYC } from '../state/KYCContext';
import { TOKENS } from '@/core/design-system/tokens';
import { MotiView } from 'moti';

const STEPS = [
  {
    icon: 'badge',
    title: 'Foto de tu documento',
    description: 'DNI, Cédula o Pasaporte — frente y dorso con buena iluminación.',
  },
  {
    icon: 'face',
    title: 'Selfie de verificación',
    description: 'Una foto de tu rostro sosteniendo el documento. Debe ser clara y sin filtros.',
  },
  {
    icon: 'hourglass-top',
    title: 'Revisión en 24 horas',
    description: 'Nuestro equipo revisará tu solicitud y te notificaremos el resultado.',
  },
];

function FadeSlide({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: ty }] }}>
      {children}
    </Animated.View>
  );
}

export default function KYCIntroScreen() {
  const { start, loading, error } = useKYC();

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.background}
    >
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
          </Pressable>
          <Text style={s.headerTitle}>Verificación</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <FadeSlide delay={100}>
          <View style={s.heroIcon}>
            <MaterialIcons name="verified-user" size={56} color={TOKENS.color.primary} />
          </View>
          <Text style={s.heroTitle}>Verificá tu identidad</Text>
          <Text style={s.heroSubtitle}>
            El proceso toma menos de 5 minutos y solo se realiza una vez.
          </Text>
        </FadeSlide>

        {/* Steps card */}
        <FadeSlide delay={200}>
          <View style={s.card}>
            <Text style={s.cardTitle}>¿Qué vas a necesitar?</Text>
            {STEPS.map((step, idx) => (
              <View key={idx} style={s.stepRow}>
                <View style={s.stepNumber}>
                  <Text style={s.stepNumberText}>{idx + 1}</Text>
                </View>
                <View style={s.stepIcon}>
                  <MaterialIcons name={step.icon as any} size={20} color={TOKENS.color.primary} />
                </View>
                <View style={s.stepText}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepDesc}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeSlide>

        {/* Privacy banner */}
        <FadeSlide delay={300}>
          <View style={s.privacyBanner}>
            <MaterialIcons name="security" size={18} color="#16a34a" />
            <Text style={s.privacyText}>
              Tus datos se encriptan y nunca se comparten con terceros.
              Solo se usan para verificar tu identidad.
            </Text>
          </View>
        </FadeSlide>

        {/* Error */}
        {!!error && (
          <View style={{ backgroundColor: '#fee2e2', borderRadius: 12, padding: 14, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <MaterialIcons name="error-outline" size={18} color="#dc2626" />
            <Text style={{ flex: 1, fontSize: 13, color: '#dc2626', lineHeight: 18 }}>{error}</Text>
          </View>
        )}

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
          style={s.ctaContainer}
        >
          <Pressable
            style={({ pressed }) => [s.primaryButton, pressed && s.buttonPressed]}
            onPress={start}
            disabled={loading}
          >
            <LinearGradient
              colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.buttonGradient}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                  <Text style={s.primaryButtonText}>Comenzar ahora</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </>
              }
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.secondaryButton, pressed && s.buttonPressed]}
          >
            <Text style={s.secondaryButtonText}>Lo haré más tarde</Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  background: { flex: 1 },
  container: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: TOKENS.color.text, textAlign: 'center' },
  heroSubtitle: { fontSize: 15, color: TOKENS.color.sub, textAlign: 'center', lineHeight: 22 },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TOKENS.color.text },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.color.text, marginBottom: 2 },
  stepDesc: { fontSize: 13, color: TOKENS.color.sub, lineHeight: 18 },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
  },
  privacyText: { flex: 1, fontSize: 13, color: TOKENS.color.sub, lineHeight: 18 },
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
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  secondaryButtonText: { fontSize: 15, color: TOKENS.color.sub, fontWeight: '500' },
});
