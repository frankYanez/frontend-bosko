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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import api from '@/core/api/axiosinstance';
import { TOKENS } from '@/core/design-system/tokens';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const PRIMARY = TOKENS.color.primary;

function getStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  return s as 0 | 1 | 2 | 3;
}

const STRENGTH_LABELS = ['', 'Débil', 'Regular', 'Fuerte'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#16a34a'];

function StrengthBar({ password }: { password: string }) {
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <View style={sb.row}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[sb.segment, { backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : '#E5E7EB' }]}
        />
      ))}
      <Text style={[sb.label, { color: STRENGTH_COLORS[strength] }]}>
        {STRENGTH_LABELS[strength]}
      </Text>
    </View>
  );
}
const sb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontWeight: '700', width: 60 },
});

function FieldInput({
  label,
  value,
  onChange,
  show,
  toggleShow,
  inputRef,
  nextRef,
  last,
  focused,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  show: boolean;
  toggleShow: () => void;
  inputRef?: React.RefObject<TextInput>;
  nextRef?: React.RefObject<TextInput>;
  last?: boolean;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <View style={s.fieldContainer}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.inputWrapper, focused && s.inputWrapperFocused]}>
        <Ionicons name="lock-closed-outline" size={20} color={focused ? PRIMARY : TOKENS.color.sub} />
        <TextInput
          ref={inputRef}
          style={s.input}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholderTextColor={TOKENS.color.sub}
          placeholder="••••••••"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={last ? 'done' : 'next'}
          onSubmitEditing={last ? undefined : () => nextRef?.current?.focus()}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <Pressable onPress={toggleShow} hitSlop={8}>
          <Ionicons
            name={show ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={focused ? PRIMARY : TOKENS.color.sub}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.background}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.flex}
        >
          <ScrollView
            contentContainerStyle={s.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ translateY }] }]}>
              {/* Header */}
              <View style={s.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={s.backButton}>
                  <Ionicons name="arrow-back" size={24} color={TOKENS.color.text} />
                </Pressable>
                <Text style={s.headerTitle}>Cambiar contraseña</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Icon */}
              <View style={s.iconCircle}>
                <Ionicons name="shield-checkmark" size={36} color={PRIMARY} />
              </View>
              <Text style={s.subtitle}>
                Tu contraseña debe tener al menos 8 caracteres.
              </Text>

              {/* Card */}
              <View style={s.card}>
                <FieldInput
                  label="Contraseña actual"
                  value={currentPassword}
                  onChange={t => { setCurrentPassword(t); setError(''); }}
                  show={showCurrent}
                  toggleShow={() => setShowCurrent(v => !v)}
                  nextRef={newRef}
                  focused={focused === 'current'}
                  onFocus={() => setFocused('current')}
                  onBlur={() => setFocused(null)}
                />
                <FieldInput
                  label="Nueva contraseña"
                  value={newPassword}
                  onChange={t => { setNewPassword(t); setError(''); }}
                  show={showNew}
                  toggleShow={() => setShowNew(v => !v)}
                  inputRef={newRef}
                  nextRef={confirmRef}
                  focused={focused === 'new'}
                  onFocus={() => setFocused('new')}
                  onBlur={() => setFocused(null)}
                />
                <StrengthBar password={newPassword} />

                <FieldInput
                  label="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={t => { setConfirmPassword(t); setError(''); }}
                  show={showConfirm}
                  toggleShow={() => setShowConfirm(v => !v)}
                  inputRef={confirmRef}
                  last
                  focused={focused === 'confirm'}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                />

                {!!error && <Text style={s.errorText}>{error}</Text>}

                <Pressable
                  onPress={handleSave}
                  disabled={isLoading}
                  style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
                >
                  <LinearGradient
                    colors={[PRIMARY, '#a0032a', TOKENS.color.primaryDark ?? '#3D000F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.buttonGradient}
                  >
                    {isLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.buttonText}>Guardar cambios</Text>
                    }
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  inner: { flex: 1, alignItems: 'center' },
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
    backgroundColor: 'rgba(255,255,255,0.8)',
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
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: PRIMARY,
    backgroundColor: '#fff',
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
    shadowColor: PRIMARY,
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
