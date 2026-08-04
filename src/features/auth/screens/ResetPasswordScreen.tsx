/**
 * ResetPasswordScreen — Restablecer contraseña con token del email.
 * POST /auth/reset-password — body: { email, token, newPassword }
 * Rebrand "Señal Nocturna" — usa los componentes reales del design system
 * (`Input`, `Button`), mismo chrome que el resto del flujo de auth.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from '@/core/components/BlurView';
import { Input } from '@/core/components/Input';
import { Button, TOKENS } from '@/core/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '@/core/api/axiosinstance';

const { width } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  // email y token vienen como query params del deep link del email
  const { email = '', token = '' } = useLocalSearchParams<{ email: string; token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = (): string => {
    if (newPassword.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden.';
    return '';
  };

  const handleSubmit = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }

    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'NOT_FOUND')      setError('Usuario no encontrado.');
      else if (code === 'BAD_REQUEST') setError(err.response.data.message ?? 'Token inválido o contraseña muy corta.');
      else setError('Error al restablecer. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.background}>
        <View style={styles.successContainer}>
          <Animated.View style={[styles.cardGlow, { backgroundColor: '#0A0910', opacity: fadeAnim }]}>
          <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
            <BlurView intensity={30} tint="dark" style={[styles.card, styles.successCard]}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={48} color="#00E5A0" />
              </View>
              <Text style={styles.successTitle}>¡Contraseña actualizada!</Text>
              <Text style={styles.successText}>
                Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
              </Text>
              <Button label="Iniciar sesión" onPress={() => router.replace('/login')} fullWidth />
            </BlurView>
          </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#EDEAF5" />
          </Pressable>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <View style={styles.titleRow}>
              <View style={styles.heroIconCircle}>
                <Ionicons name="key-outline" size={32} color={TOKENS.color.signal} />
              </View>
              <Text style={styles.title}>Nueva contraseña</Text>
              <Text style={styles.subtitle}>
                Elegí una contraseña segura de al menos 8 caracteres.
              </Text>
            </View>

            <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
            <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
              <BlurView intensity={30} tint="dark" style={styles.card}>
                <View style={styles.fieldGap}>
                  <Input
                    leftIcon="lock-closed-outline"
                    placeholder="Nueva contraseña"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGap}>
                  <Input
                    leftIcon="lock-closed-outline"
                    placeholder="Confirmar contraseña"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                  />
                </View>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <Button label="Restablecer contraseña" onPress={handleSubmit} loading={loading} fullWidth />
              </BlurView>
            </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0A0910' },
  flex: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,45,111,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleRow: { alignItems: 'center', marginBottom: 28 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Archivo_700Bold',
    color: '#EDEAF5',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  cardShadow: {
    borderRadius: 26,
    shadowColor: '#FF2D6F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 34,
    elevation: 12,
  },
  cardGlow: {
    borderRadius: 26,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  card: {
    width: width - 48,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fieldGap: { marginBottom: 14 },
  errorText: { fontSize: 13, color: '#FF4D4D', marginBottom: 14, marginLeft: 4 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  successCard: { alignItems: 'center', gap: 14 },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,229,160,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5', textAlign: 'center' },
  successText: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
