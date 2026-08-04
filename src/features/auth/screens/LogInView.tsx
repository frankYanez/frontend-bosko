/**
 * LogInView — Pantalla de inicio de sesión.
 * Rebrand "Señal Nocturna": insignia bo, glass sobre negro profundo, usa los
 * componentes reales del design system (`Input`, `Button`) para los campos y
 * el CTA en vez de duplicar estilos a mano.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { Input } from '@/core/components/Input';
import { Button } from '@/core/design-system';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import { getUserErrorMessage } from '@/lib/errors';
import { BrandMark } from '@/components/BrandMark';

const { width } = Dimensions.get('window');

export default function LogInView({ toRegister }: { toRegister?: () => void }) {
  const { login, isLoading, error, clearError } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glow = useRef(new Animated.Value(0.7)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, useNativeDriver: true }),
    ]).start();

    // Glow de fondo pulsante — mismo lenguaje que AnimatedSplashScreen, le da vida al gradiente estático
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.7, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    setLocalError('');
    clearError();
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace('/(tabs)');
    } catch (err) {
      setLocalError(getUserErrorMessage(err));
    }
  };

  const displayError = localError || error || '';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.background}>
        <LinearGradient colors={['#0A0910', '#1a000d', '#0A0910']} style={StyleSheet.absoluteFill} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              opacity: glow.interpolate({ inputRange: [0.7, 1], outputRange: [0.5, 1] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0.7, 1], outputRange: [1, 1.18] }) }, { rotate: '-8deg' }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,45,111,0.24)', 'rgba(255,45,111,0.10)', 'rgba(255,45,111,0)']}
            locations={[0, 0.55, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <BrandMark variant="mark" size={68} />
            <View style={{ height: 14 }} />
            <BrandMark variant="wordmark" size={30} color="#fff" tagline />
            <View style={{ height: 28 }} />

            <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
            <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
              <BlurView intensity={30} tint="dark" style={styles.card}>
                <Text style={styles.cardTitle}>Iniciar sesión</Text>

                <View style={styles.fieldGap}>
                  <Input
                    testID="login-email"
                    leftIcon="mail-outline"
                    placeholder="Correo electrónico"
                    value={email}
                    onChangeText={text => { setEmail(text); setLocalError(''); clearError(); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>

                <View style={styles.fieldGap}>
                  <Input
                    ref={passwordRef}
                    testID="login-password"
                    leftIcon="lock-closed-outline"
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={text => { setPassword(text); setLocalError(''); clearError(); }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>

                {!!displayError && <Text style={styles.errorText}>{displayError}</Text>}

                <Pressable onPress={() => router.push('/login/forgot-password')} style={styles.forgotContainer}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                <Button label="Ingresar" onPress={handleLogin} loading={isLoading} fullWidth style={styles.ctaButton} />

                <View style={styles.registerRow}>
                  <Text style={styles.registerPrompt}>¿No tenés cuenta? </Text>
                  <Pressable onPress={toRegister}>
                    <Text style={styles.registerLink}>Registrarse</Text>
                  </Pressable>
                </View>
              </BlurView>
            </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0A0910' },
  glow: {
    position: 'absolute',
    top: -180,
    left: -40,
    right: -40,
    height: 520,
    opacity: 0.9,
  },
  flex: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },
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
  cardTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5', marginBottom: 26 },
  fieldGap: { marginBottom: 16 },
  errorText: { fontSize: 13, color: '#FF4D4D', marginBottom: 10, marginLeft: 4 },
  forgotContainer: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 13, color: '#FF2D6F', fontWeight: '500' },
  ctaButton: { marginBottom: 20 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerPrompt: { fontSize: 14, color: 'rgba(237,234,245,0.55)' },
  registerLink: { fontSize: 14, color: '#FF2D6F', fontWeight: '600' },
});
