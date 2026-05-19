import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import { TOKENS } from '@/core/design-system/tokens';

export default function EditEmail() {
  const { authState } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Email actual</Text>
        <Text style={styles.value}>{authState.user?.email ?? authState.userEmail ?? '—'}</Text>
        <Text style={styles.note}>El email no puede cambiarse directamente.</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
        onPress={() => router.push('/(tabs)/profile/ChangePassword')}
      >
        <MaterialIcons name="lock-outline" size={18} color={TOKENS.color.primary} />
        <Text style={styles.buttonText}>Cambiar contraseña</Text>
        <MaterialIcons name="chevron-right" size={18} color={TOKENS.color.sub} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  field: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  label: { fontSize: 12, color: TOKENS.color.sub, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, color: TOKENS.color.text, fontWeight: '500' },
  note: { fontSize: 12, color: TOKENS.color.sub, marginTop: 4 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonText: { flex: 1, fontSize: 15, color: TOKENS.color.text, fontWeight: '500' },
});
