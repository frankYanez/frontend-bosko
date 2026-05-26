import React from 'react';
import { View, StyleSheet } from 'react-native';
import ToastLib, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '@/core/design-system/tokens';

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[s.base, s.success]}
      contentContainerStyle={s.content}
      text1Style={s.text1}
      text2Style={s.text2}
      renderLeadingIcon={() => (
        <View style={s.iconWrap}>
          <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
        </View>
      )}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[s.base, s.error]}
      contentContainerStyle={s.content}
      text1Style={s.text1}
      text2Style={s.text2}
      renderLeadingIcon={() => (
        <View style={s.iconWrap}>
          <Ionicons name="alert-circle" size={22} color="#ef4444" />
        </View>
      )}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[s.base, s.info]}
      contentContainerStyle={s.content}
      text1Style={s.text1}
      text2Style={s.text2}
      renderLeadingIcon={() => (
        <View style={s.iconWrap}>
          <Ionicons name="information-circle" size={22} color={TOKENS.color.primary} />
        </View>
      )}
    />
  ),
};

/** Helpers — import { toast } from '@/core/components/Toast' */
export const toast = {
  success: (text1: string, text2?: string) =>
    ToastLib.show({ type: 'success', text1, text2, visibilityTime: 3000 }),
  error: (text1: string, text2?: string) =>
    ToastLib.show({ type: 'error', text1, text2, visibilityTime: 4000 }),
  info: (text1: string, text2?: string) =>
    ToastLib.show({ type: 'info', text1, text2, visibilityTime: 3000 }),
};

/** Colocar UNA VEZ en app/_layout.tsx, fuera del Stack */
export function ToastRoot() {
  return <ToastLib config={toastConfig} topOffset={60} />;
}

const s = StyleSheet.create({
  base: {
    height: 'auto' as any,
    minHeight: 60,
    borderRadius: 14,
    borderLeftWidth: 0,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    marginHorizontal: 12,
    backgroundColor: '#fff',
  },
  success: { borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  error:   { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  info:    { borderLeftWidth: 4, borderLeftColor: TOKENS.color.primary },
  content: { paddingHorizontal: 12 },
  iconWrap: { justifyContent: 'center', paddingLeft: 14 },
  text1: { fontSize: 14, fontWeight: '700', color: '#1e1e1e' },
  text2: { fontSize: 13, color: '#6b6b6b', marginTop: 2 },
});
