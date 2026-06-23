/**
 * RegisterView — Pantalla de registro multi-paso.
 * Cada paso es un campo distinto con validación progresiva.
 * Diseño glassmorphism consistente con LogInView.
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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import { TOKENS } from '@/core/design-system/tokens';

const { width } = Dimensions.get('window');

interface Step {
  label: string;
  placeholder: string;
  field: keyof FormData;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secure?: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface FormData {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
}

const STEPS: Step[] = [
  { label: 'Nombre',     placeholder: 'Tu nombre',            field: 'firstName', keyboardType: 'default',       icon: 'person' },
  { label: 'Apellido',   placeholder: 'Tu apellido',          field: 'lastName',  keyboardType: 'default',       icon: 'person' },
  { label: 'Email',      placeholder: 'tucorreo@ejemplo.com', field: 'email',     keyboardType: 'email-address', icon: 'email'  },
  { label: 'Contraseña', placeholder: 'Mínimo 8 caracteres',  field: 'password',  secure: true,                  icon: 'lock'   },
];

export default function RegisterView({ toRegister }: { toRegister?: () => void }) {
  const { registerUser, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const inputRef = useRef<TextInput>(null);
  const progress = useRef(new Animated.Value(1 / STEPS.length)).current;

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const progressStyle = {
    width: progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };

  // Validar el campo del paso actual antes de avanzar
  const validateCurrent = async (): Promise<boolean> => {
    const value = formData[currentStep.field].trim();

    if (!value) {
      setFieldError('Este campo es obligatorio');
      return false;
    }

    if (currentStep.field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setFieldError('Ingresá un email válido');
        return false;
      }
    }

    if (currentStep.field === 'password') {
      if (value.length < 8) {
        setFieldError('La contraseña debe tener al menos 8 caracteres');
        return false;
      }
      if (!/[A-Z]/.test(value)) {
        setFieldError('La contraseña debe tener al menos una mayúscula');
        return false;
      }
      if (!/[0-9]/.test(value)) {
        setFieldError('La contraseña debe tener al menos un número');
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    Keyboard.dismiss();
    setFieldError('');
    const valid = await validateCurrent();
    if (!valid) return;

    if (isLastStep) {
      await handleFinish();
    } else {
      setStep(s => s + 1);
      // Actualizar progress para la barra animada
      Animated.timing(progress, { toValue: (step + 2) / STEPS.length, duration: 300, useNativeDriver: false }).start();
      // Foco en el nuevo input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleBack = () => {
    setFieldError('');
    if (step > 0) {
      setStep(s => s - 1);
      Animated.timing(progress, { toValue: step / STEPS.length, duration: 300, useNativeDriver: false }).start();
    } else {
      toRegister?.();
    }
  };

  const handleFinish = async () => {
    const email     = formData.email.trim().toLowerCase();
    const firstName = formData.firstName.trim();
    const lastName  = formData.lastName.trim();
    try {
      await registerUser({ firstName, lastName, email, password: formData.password });
      router.replace(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al registrar la cuenta';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    }
  };

  const displayError = fieldError || error || '';

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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.container}>
            {/* Logo compacto */}
            <Image
              source={require('@/assets/images/bosko-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />

            {/* Tarjeta glass */}
            <View style={styles.cardShadow}>
              <BlurView intensity={30} tint="light" style={styles.card}>
                {/* Header con barra de progreso */}
                <View style={styles.cardHeader}>
                  <Pressable onPress={handleBack} hitSlop={8}>
                    <MaterialIcons name="arrow-back" size={22} color={TOKENS.color.text} />
                  </Pressable>
                  <Text style={styles.stepCounter}>
                    {step + 1} / {STEPS.length}
                  </Text>
                </View>

                {/* Barra de progreso */}
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, progressStyle]} />
                </View>

                <Text style={styles.cardTitle}>Crear cuenta</Text>
                <Text style={styles.stepLabel}>{currentStep.label}</Text>

                {/* Input del paso actual */}
                <View style={[styles.inputWrapper, displayError ? styles.inputError : null]}>
                  <MaterialIcons name={currentStep.icon} size={20} color={TOKENS.color.sub} />
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder={currentStep.placeholder}
                    placeholderTextColor={TOKENS.color.sub}
                    value={formData[currentStep.field]}
                    onChangeText={text => {
                      setFormData(prev => ({ ...prev, [currentStep.field]: text }));
                      setFieldError('');
                      clearError();
                    }}
                    keyboardType={currentStep.keyboardType || 'default'}
                    secureTextEntry={currentStep.secure && !showPassword}
                    autoCapitalize={['firstName', 'lastName'].includes(currentStep.field) ? 'words' : 'none'}
                    autoCorrect={false}
                    returnKeyType={isLastStep ? 'done' : 'next'}
                    onSubmitEditing={handleNext}
                    autoFocus
                  />
                  {currentStep.secure && (
                    <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                      <MaterialIcons
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color={TOKENS.color.sub}
                      />
                    </Pressable>
                  )}
                </View>

                {!!displayError && (
                  <Text style={styles.errorText}>{displayError}</Text>
                )}

                {/* Botón siguiente / finalizar */}
                <View style={styles.buttonShadow}>
                  <Pressable
                    onPress={handleNext}
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
                        : <Text style={styles.buttonText}>{isLastStep ? 'Crear cuenta' : 'Siguiente'}</Text>
                      }
                    </LinearGradient>
                  </Pressable>
                </View>

                {/* Link a login */}
                {step === 0 && (
                  <View style={styles.loginRow}>
                    <Text style={styles.loginPrompt}>¿Ya tenés cuenta? </Text>
                    <Pressable onPress={toRegister}>
                      <Text style={styles.loginLink}>Ingresar</Text>
                    </Pressable>
                  </View>
                )}
              </BlurView>
            </View>
          </View>
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
    width: 60,
    height: 60,
    marginBottom: 20,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCounter: {
    fontSize: 13,
    color: TOKENS.color.sub,
    fontWeight: '500',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: TOKENS.color.primary,
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 15,
    color: TOKENS.color.sub,
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
    marginBottom: 12,
    marginLeft: 4,
  },
  buttonShadow: {
    borderRadius: 14,
    marginTop: 8,
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: { fontSize: 14, color: TOKENS.color.sub },
  loginLink: {
    fontSize: 14,
    color: TOKENS.color.primary,
    fontWeight: '600',
  },
});
