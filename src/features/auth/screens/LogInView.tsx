/**
 * LogInView — Pantalla de inicio de sesión.
 * Diseño glassmorphism con gradiente de fondo y tarjeta glass translúcida.
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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import { TOKENS } from '@/core/design-system/tokens';
import { getUserErrorMessage } from '@/lib/errors';

const { width } = Dimensions.get('window');

export default function LogInView({ toRegister }: { toRegister?: () => void }) {
  const { login, isLoading, error, clearError } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, useNativeDriver: true }),
    ]).start();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();

    // Validación básica
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
      {/* Fondo con gradiente suave */}
      <LinearGradient
        colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View
            style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {/* Logo */}
            <Image
              source={require('@/assets/images/bosko-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.brand}>Bosko</Text>
            <Text style={styles.subtitle}>Encontrá o publicá servicios fácilmente</Text>

            {/* Tarjeta glass */}
            <View style={styles.cardShadow}>
              <BlurView intensity={30} tint="light" style={styles.card}>
                <Text style={styles.cardTitle}>Iniciar sesión</Text>

                {/* Email */}
                <View style={[styles.inputWrapper, displayError ? styles.inputError : null]}>
                  <MaterialIcons name="email" size={20} color={TOKENS.color.sub} />
                  <TextInput
                    testID="login-email"
                    style={styles.input}
                    placeholder="Correo electrónico"
                    placeholderTextColor={TOKENS.color.sub}
                    value={email}
                    onChangeText={text => { setEmail(text); setLocalError(''); clearError(); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>

                {/* Contraseña */}
                <View style={[styles.inputWrapper, displayError ? styles.inputError : null]}>
                  <MaterialIcons name="lock" size={20} color={TOKENS.color.sub} />
                  <TextInput
                    ref={passwordRef}
                    testID="login-password"
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor={TOKENS.color.sub}
                    value={password}
                    onChangeText={text => { setPassword(text); setLocalError(''); clearError(); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={TOKENS.color.sub}
                    />
                  </Pressable>
                </View>

                {/* Error */}
                {!!displayError && (
                  <Text style={styles.errorText}>{displayError}</Text>
                )}

                {/* Olvidé contraseña */}
                <Pressable
                  onPress={() => router.push('/login/forgot-password')}
                  style={styles.forgotContainer}
                >
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                {/* Botón ingresar */}
                <View style={styles.buttonShadow}>
                  <Pressable
                    onPress={handleLogin}
                    disabled={isLoading}
                    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  >
                    <LinearGradient
                      colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {isLoading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.buttonText}>Ingresar</Text>
                      }
                    </LinearGradient>
                  </Pressable>
                </View>

                {/* Ir a registro */}
                <View style={styles.registerRow}>
                  <Text style={styles.registerPrompt}>¿No tenés cuenta? </Text>
                  <Pressable onPress={toRegister}>
                    <Text style={styles.registerLink}>Registrarse</Text>
                  </Pressable>
                </View>
              </BlurView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: TOKENS.color.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    marginBottom: 32,
    textAlign: 'center',
  },
  cardShadow: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  card: {
    width: width - 48,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
    marginBottom: 12,
    minHeight: 52,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.color.text,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 8,
    marginLeft: 4,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: TOKENS.color.primary,
    fontWeight: '500',
  },
  buttonShadow: {
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPrompt: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  registerLink: {
    fontSize: 14,
    color: TOKENS.color.primary,
    fontWeight: '600',
  },
});
