/**
 * ForgotPasswordScreen — Recuperación de contraseña.
 * Envía un email de reseteo al usuario (POST /auth/forgot-password).
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/core/api/axiosinstance';
import { TOKENS } from '@/core/design-system/tokens';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

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
      <LinearGradient
        colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
            {/* Botón volver */}
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={12}
            >
              <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
            </Pressable>

            {/* Ícono decorativo */}
            <View style={styles.iconCircle}>
              <MaterialIcons name="lock-reset" size={36} color={TOKENS.color.primary} />
            </View>

            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
            <Text style={styles.description}>
              Ingresá tu email y te enviamos un enlace para restablecerla.
            </Text>

            <BlurView intensity={30} tint="light" style={styles.card}>
              {success ? (
                <View style={styles.successContainer}>
                  <MaterialIcons name="check-circle" size={48} color="#22c55e" />
                  <Text style={styles.successTitle}>¡Email enviado!</Text>
                  <Text style={styles.successText}>
                    Si ese email está registrado, recibirás las instrucciones en minutos.
                    Revisá también tu carpeta de spam.
                  </Text>
                  <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  >
                    <LinearGradient
                      colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>Volver al inicio</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              ) : (
                /* Formulario */
                <>
                  <Text style={styles.cardTitle}>Recuperar contraseña</Text>

                  <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                    <MaterialIcons name="email" size={20} color={TOKENS.color.sub} />
                    <TextInput
                      style={styles.input}
                      placeholder="Correo electrónico"
                      placeholderTextColor={TOKENS.color.sub}
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

                  <Pressable
                    onPress={handleSend}
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
                        : <Text style={styles.buttonText}>Enviar email</Text>
                      }
                    </LinearGradient>
                  </Pressable>
                </>
              )}
            </BlurView>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 0,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: TOKENS.color.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  card: {
    width: width - 48,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 16,
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
    marginBottom: 8,
    minHeight: 52,
  },
  inputError: { borderColor: '#ef4444' },
  input: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.color.text,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
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
  successContainer: {
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  successText: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
