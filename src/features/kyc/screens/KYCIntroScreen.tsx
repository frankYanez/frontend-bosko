/**
 * KYCIntroScreen — Pantalla de introducción al proceso KYC.
 * Explica qué documentos se necesitan y qué esperar del proceso.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { TOKENS } from '@/core/design-system/tokens';

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

export default function KYCIntroScreen() {
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
          <Text style={styles.headerTitle}>Verificación</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 100 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <MaterialIcons name="verified-user" size={56} color={TOKENS.color.primary} />
          </View>
          <Text style={styles.heroTitle}>Verificá tu identidad</Text>
          <Text style={styles.heroSubtitle}>
            El proceso toma menos de 5 minutos y solo se realiza una vez.
          </Text>
        </MotiView>

        {/* Pasos */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>¿Qué vas a necesitar?</Text>
            {STEPS.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <View style={styles.stepIcon}>
                  <MaterialIcons name={step.icon as any} size={20} color={TOKENS.color.primary} />
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
              </View>
            ))}
          </BlurView>
        </MotiView>

        {/* Privacidad */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
        >
          <View style={styles.privacyBanner}>
            <MaterialIcons name="security" size={18} color="#16a34a" />
            <Text style={styles.privacyText}>
              Tus datos se encriptan y nunca se comparten con terceros.
              Solo se usan para verificar tu identidad.
            </Text>
          </View>
        </MotiView>

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
          style={styles.ctaContainer}
        >
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/(tabs)/profile/kyc/document')}
          >
            <LinearGradient
              colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Comenzar ahora</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>Lo haré más tarde</Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
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
    marginBottom: 8,
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
  hero: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: TOKENS.color.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    color: TOKENS.color.sub,
    lineHeight: 18,
  },
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
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: TOKENS.color.sub,
    lineHeight: 18,
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
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: TOKENS.color.sub,
    fontWeight: '500',
  },
});
