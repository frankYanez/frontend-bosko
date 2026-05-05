/**
 * ChangePasswordScreen — Cambio de contraseña desde el perfil.
 * Requiere la contraseña actual + nueva contraseña (PATCH /users/me/password).
 */

import React, { useRef, useState, useEffect } from 'react';
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
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import api from '@/core/api/axiosinstance';
import { TOKENS } from '@/core/design-system/tokens';

const { width } = Dimensions.get('window');

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSave = async () => {
    Keyboard.dismiss();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completá todos los campos');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      Alert.alert('¡Listo!', 'Tu contraseña fue actualizada exitosamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al cambiar la contraseña';
      setError(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({
    label,
    value,
    onChange,
    show,
    toggleShow,
    ref: inputRef,
    nextRef,
    last,
  }: any) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrapper]}>
        <MaterialIcons name="lock" size={20} color={TOKENS.color.sub} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={(t: string) => { onChange(t); setError(''); }}
          secureTextEntry={!show}
          placeholderTextColor={TOKENS.color.sub}
          placeholder="••••••••"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={last ? 'done' : 'next'}
          onSubmitEditing={last ? handleSave : () => nextRef?.current?.focus()}
        />
        <Pressable onPress={toggleShow} hitSlop={8}>
          <MaterialIcons
            name={show ? 'visibility' : 'visibility-off'}
            size={20}
            color={TOKENS.color.sub}
          />
        </Pressable>
      </View>
    </View>
  );

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
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY }] }]}>
              {/* Header */}
              <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
                  <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Cambiar contraseña</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Ícono */}
              <View style={styles.iconCircle}>
                <MaterialIcons name="shield" size={36} color={TOKENS.color.primary} />
              </View>

              <Text style={styles.subtitle}>
                Tu contraseña debe tener al menos 8 caracteres.
              </Text>

              {/* Card glass */}
              <BlurView intensity={30} tint="light" style={styles.card}>
                <InputField
                  label="Contraseña actual"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  show={showCurrent}
                  toggleShow={() => setShowCurrent(v => !v)}
                  nextRef={newRef}
                />
                <InputField
                  label="Nueva contraseña"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNew}
                  toggleShow={() => setShowNew(v => !v)}
                  ref={newRef}
                  nextRef={confirmRef}
                />
                <InputField
                  label="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showNew}
                  toggleShow={() => setShowNew(v => !v)}
                  ref={confirmRef}
                  last
                />

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                  onPress={handleSave}
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
                      : <Text style={styles.buttonText}>Guardar cambios</Text>
                    }
                  </LinearGradient>
                </Pressable>
              </BlurView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    marginBottom: 28,
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
    gap: 4,
  },
  fieldContainer: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TOKENS.color.text,
    marginBottom: 6,
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
    minHeight: 52,
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
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
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
});
