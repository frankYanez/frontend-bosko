/**
 * VerifyPhoneScreen — Verificación de teléfono via Firebase Phone Auth.
 * Flujo: ingresá número → recibís SMS → ingresás código → teléfono verificado.
 * Requiere build nativo (no funciona en Expo Go).
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { verifyPhoneWithFirebase } from '@/features/servicesUser/services/profile';
import { TOKENS } from '@/core/design-system/tokens';

type Step = 'phone' | 'code';

export default function VerifyPhoneScreen() {
  const { refreshProfile } = useProfile();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef<any>(null);

  const handleSendCode = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Ingresá un número de teléfono');
      return;
    }

    // Normalizar formato internacional
    const normalized = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;

    setLoading(true);
    try {
      // Importación dinámica para no romper si no hay build nativo
      const auth = require('@react-native-firebase/auth').default;
      const confirmation = await auth().signInWithPhoneNumber(normalized);
      confirmationRef.current = confirmation;
      setStep('code');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo enviar el SMS. Verificá el número.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmationRef.current.confirm(trimmed);
      const idToken = await userCredential.user.getIdToken();
      await verifyPhoneWithFirebase(idToken);
      await refreshProfile();
      Alert.alert('¡Listo!', 'Tu teléfono fue verificado correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      if (err?.code === 'auth/invalid-verification-code') {
        Alert.alert('Error', 'Código incorrecto. Intentá de nuevo.');
      } else {
        Alert.alert('Error', err?.message || 'No se pudo verificar el código.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCode('');
    setStep('phone');
    confirmationRef.current = null;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Verificar teléfono</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.container}>
            <BlurView intensity={30} tint="light" style={styles.card}>
              {/* Ícono */}
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name={step === 'phone' ? 'phone' : 'sms'}
                  size={32}
                  color={TOKENS.color.primary}
                />
              </View>

              <Text style={styles.title}>
                {step === 'phone' ? 'Ingresá tu número' : 'Ingresá el código'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'phone'
                  ? 'Te enviaremos un SMS con un código de verificación'
                  : `Enviamos un código de 6 dígitos a ${phone}`}
              </Text>

              {step === 'phone' ? (
                <View style={styles.inputWrap}>
                  <Text style={styles.flag}>🇦🇷</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+54 9 11 1234-5678"
                    placeholderTextColor={TOKENS.color.sub}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSendCode}
                  />
                </View>
              ) : (
                <View style={styles.inputWrap}>
                  <MaterialIcons name="lock" size={20} color={TOKENS.color.sub} />
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="123456"
                    placeholderTextColor={TOKENS.color.sub}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                  />
                </View>
              )}

              <Pressable
                style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                onPress={step === 'phone' ? handleSendCode : handleVerifyCode}
                disabled={loading}
              >
                <LinearGradient
                  colors={[TOKENS.color.primary, '#a0032a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.btnText}>
                        {step === 'phone' ? 'Enviar código' : 'Verificar'}
                      </Text>
                  }
                </LinearGradient>
              </Pressable>

              {step === 'code' && (
                <Pressable onPress={handleResend} style={styles.resendBtn}>
                  <Text style={styles.resendText}>¿No recibiste el código? Reenviar</Text>
                </Pressable>
              )}
            </BlurView>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.color.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
    minHeight: 52,
  },
  flag: { fontSize: 20 },
  input: {
    flex: 1,
    fontSize: 16,
    color: TOKENS.color.text,
    paddingVertical: 8,
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
  },
  btn: {
    width: '100%',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: { paddingVertical: 4 },
  resendText: {
    fontSize: 14,
    color: TOKENS.color.primary,
    fontWeight: '500',
  },
});
