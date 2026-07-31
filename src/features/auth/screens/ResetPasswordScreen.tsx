/**
 * ResetPasswordScreen — Restablecer contraseña con token del email.
 * POST /auth/reset-password — body: { email, token, newPassword }
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '@/core/api/axiosinstance';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors, wash } from '@/core/design-system';

export default function ResetPasswordScreen() {
  const tc = useThemeColors();
  // email y token vienen como query params del deep link del email
  const { email = '', token = '' } = useLocalSearchParams<{ email: string; token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      <LinearGradient colors={wash(tc)} style={styles.bg}>
        <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
          <BlurView intensity={30} tint="light" style={[styles.successCard, { borderColor: tc.cardBorder }]}>
            <View style={[styles.successIcon, { backgroundColor: tc.accent }]}>
              <MaterialIcons name="check-circle" size={56} color="#16a34a" />
            </View>
            <Text style={[styles.successTitle, { color: tc.text }]}>¡Contraseña actualizada!</Text>
            <Text style={[styles.successText, { color: tc.textSub }]}>
              Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
            </Text>
            <View style={styles.btnShadow}>
              <Pressable
                onPress={() => router.replace('/login')}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              >
                <LinearGradient
                  colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Text style={styles.btnText}>Iniciar sesión</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={wash(tc)} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.backBtn, { backgroundColor: tc.surface }]}>
              <MaterialIcons name="arrow-back" size={24} color={tc.text} />
            </Pressable>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            {/* Ícono + título */}
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: tc.accent }]}>
                <MaterialIcons name="lock-reset" size={32} color={TOKENS.color.primary} />
              </View>
              <Text style={[styles.title, { color: tc.text }]}>Nueva contraseña</Text>
              <Text style={[styles.subtitle, { color: tc.textSub }]}>
                Elegí una contraseña segura de al menos 8 caracteres.
              </Text>
            </View>

            {/* Formulario */}
            <BlurView intensity={30} tint="light" style={[styles.card, { borderColor: tc.cardBorder }]}>
              {/* Nueva contraseña */}
              <View style={styles.fieldWrap}>
                <MaterialIcons name="lock" size={20} color={tc.textSub} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.input, { color: tc.text }]}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={tc.textMuted}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowNew(v => !v)} hitSlop={8}>
                  <MaterialIcons
                    name={showNew ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={tc.textSub}
                  />
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.border }]} />

              {/* Confirmar contraseña */}
              <View style={styles.fieldWrap}>
                <MaterialIcons name="lock-outline" size={20} color={tc.textSub} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.input, { color: tc.text }]}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor={tc.textMuted}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={8}>
                  <MaterialIcons
                    name={showConfirm ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={tc.textSub}
                  />
                </Pressable>
              </View>
            </BlurView>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Botón */}
            <View style={styles.btnShadow}>
              <Pressable
                onPress={handleSubmit}
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
                    : <Text style={styles.btnText}>Restablecer contraseña</Text>
                  }
                </LinearGradient>
              </Pressable>
            </View>
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
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 16,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  fieldIcon: { marginRight: 2 },
  input: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.color.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(200,200,220,0.4)',
    marginHorizontal: -16,
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
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
