/**
 * VerifyEmailScreen — Verificación de email con OTP de 6 dígitos.
 * POST /auth/verify-email — body: { email, code }
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import { TOKENS } from '@/core/design-system/tokens';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const { verifyEmail } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  // Cuenta regresiva para reenviar
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = digits.join('');

  const handleDigit = (value: string, index: number) => {
    // Solo acepta dígitos
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (code.length < CODE_LENGTH) {
      setError('Ingresá los 6 dígitos del código.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmail(email, code);
      setSuccess(true);
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      if (errorCode === 'BAD_REQUEST') {
        const msg = err.response.data.message ?? '';
        if (msg.includes('already verified')) setError('Este email ya fue verificado.');
        else setError('Código incorrecto. Verificá y volvé a intentar.');
      } else if (errorCode === 'NOT_FOUND') {
        setError('Usuario no encontrado.');
      } else {
        setError('Error al verificar. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // TODO: el backend necesita POST /auth/resend-verification para reenviar el OTP de registro
    setError('Por ahora si el código expiró, registrate de nuevo con el mismo email.');
  };

  if (success) {
    return (
      <LinearGradient colors={['#fdf2f4', '#fef7ff', '#f0f4ff']} style={styles.bg}>
        <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
          <BlurView intensity={30} tint="light" style={styles.successCard}>
            <View style={styles.successIcon}>
              <MaterialIcons name="mark-email-read" size={56} color="#16a34a" />
            </View>
            <Text style={styles.successTitle}>¡Email verificado!</Text>
            <Text style={styles.successText}>
              Tu cuenta fue activada correctamente. Ya podés usar todas las funciones de Bosko.
            </Text>
            <View style={styles.btnShadow}>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              >
                <LinearGradient
                  colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Text style={styles.btnText}>Ir al inicio</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#fdf2f4', '#fef7ff', '#f0f4ff']} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
            </Pressable>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            {/* Título */}
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="email" size={32} color={TOKENS.color.primary} />
              </View>
              <Text style={styles.title}>Verificá tu email</Text>
              <Text style={styles.subtitle}>
                Enviamos un código de 6 dígitos a{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            {/* Inputs OTP */}
            <BlurView intensity={30} tint="light" style={styles.otpCard}>
              <Text style={styles.otpLabel}>Ingresá el código</Text>
              <View style={styles.otpRow}>
                {digits.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { inputRefs.current[i] = ref; }}
                    style={[styles.otpInput, d ? styles.otpInputFilled : null]}
                    value={d}
                    onChangeText={val => handleDigit(val, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>
            </BlurView>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Botón verificar */}
            <View style={[styles.btnShadow, code.length < CODE_LENGTH && styles.btnShadowDisabled]}>
              <Pressable
                onPress={handleVerify}
                disabled={loading || code.length < CODE_LENGTH}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && code.length === CODE_LENGTH && styles.btnPressed,
                ]}
              >
                <LinearGradient
                  colors={
                    code.length === CODE_LENGTH
                      ? [TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]
                      : ['#ccc', '#bbb']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.btnText}>Verificar</Text>
                  }
                </LinearGradient>
              </Pressable>
            </View>

            {/* Reenviar */}
            <Pressable
              onPress={handleResend}
              disabled={resending || cooldown > 0}
              style={styles.resendRow}
            >
              {resending
                ? <ActivityIndicator size="small" color={TOKENS.color.primary} />
                : (
                  <Text style={styles.resendText}>
                    {cooldown > 0
                      ? `Reenviar en ${cooldown}s`
                      : '¿No recibiste el código? Reenviar'
                    }
                  </Text>
                )
              }
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  header: { marginBottom: 8 },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  titleRow: { alignItems: 'center', gap: 10, marginBottom: 8 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: TOKENS.color.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: '700',
    color: TOKENS.color.primary,
  },
  otpCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    gap: 16,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.color.sub,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  otpInput: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(200,200,220,0.6)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.color.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: TOKENS.color.primary,
    backgroundColor: 'rgba(133,0,33,0.06)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  btnShadow: {
    borderRadius: 14,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnShadowDisabled: { shadowOpacity: 0, elevation: 0 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: TOKENS.color.primary,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    gap: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TOKENS.color.text,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
});
