/**
 * ForgotPasswordScreen — Recuperación de contraseña.
 * Rebrand "Señal Nocturna" — misma lógica (POST /auth/forgot-password),
 * usa los componentes reales del design system (`Input`, `Button`, `AnimatedBackground`).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { Input } from '@/core/components/Input';
import { Button, TOKENS } from '@/core/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/core/api/axiosinstance';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const successPop = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (success) {
      successPop.setValue(0.4);
      Animated.spring(successPop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    }
  }, [success]);

  const handleSend = async () => {
    Keyboard.dismiss();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Ingresá un email válido');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccess(true);
    } catch (err: any) {
      // El backend retorna NOT_FOUND si el email no existe;
      // no lo revelamos por seguridad, mostramos éxito de todas formas
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.background}>
        <AnimatedBackground variant="minimal" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#EDEAF5" />
            </Pressable>

            {success ? (
              <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
                <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
                  <BlurView intensity={30} tint="dark" style={styles.card}>
                    <View style={styles.successContainer}>
                      <Animated.View
                        style={[
                          styles.successIconCircle,
                          { opacity: successPop, transform: [{ scale: successPop }] },
                        ]}
                      >
                        <LinearGradient
                          colors={[TOKENS.color.mint, '#00b382']}
                          style={styles.successIconGradient}
                        >
                          <Ionicons name="checkmark" size={40} color="#fff" />
                        </LinearGradient>
                      </Animated.View>
                      <Text style={styles.successTitle}>¡Email enviado!</Text>
                      <Text style={styles.successText}>
                        Si ese email está registrado, recibirás las instrucciones en minutos.
                        Revisá también tu carpeta de spam.
                      </Text>
                      <Button label="Volver al inicio" onPress={() => router.back()} fullWidth />
                    </View>
                  </BlurView>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.heroIconCircle}>
                  <Ionicons name="key-outline" size={36} color={TOKENS.color.signal} />
                </View>

                <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                <Text style={styles.description}>
                  Ingresá tu email y te enviamos un enlace para restablecerla.
                </Text>

                <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
                  <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
                    <BlurView intensity={30} tint="dark" style={styles.card}>
                      <Text style={styles.cardTitle}>Recuperar contraseña</Text>

                      <View style={styles.fieldGap}>
                        <Input
                          leftIcon="mail-outline"
                          placeholder="Correo electrónico"
                          value={email}
                          onChangeText={text => { setEmail(text); setError(''); }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleSend}
                          autoFocus
                        />
                      </View>

                      {!!error && <Text style={styles.errorText}>{error}</Text>}

                      <Button label="Enviar email" onPress={handleSend} loading={isLoading} fullWidth />
                    </BlurView>
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0A0910' },
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,45,111,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Archivo_700Bold',
    color: '#EDEAF5',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
    marginBottom: 28,
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
  cardTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5', marginBottom: 20 },
  fieldGap: { marginBottom: 14 },
  errorText: { fontSize: 13, color: '#FF4D4D', marginBottom: 14, marginLeft: 4 },
  successContainer: { alignItems: 'center', gap: 14 },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  successIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5' },
  successText: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
