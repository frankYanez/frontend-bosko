import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  /** Ionicons a la izquierda, dentro del campo (ej. `mail-outline`, `lock-closed-outline`) */
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
}

/**
 * Input — "Señal Nocturna". Foco = anillo rosa translúcido (glow), no solo un
 * cambio de borderColor: se anima un `shadowOpacity`/`shadowRadius` con
 * Animated.timing al enfocar/desenfocar, imitando el `box-shadow` de foco del
 * sistema web (0 0 0 3px rgba(255,45,111,.15)).
 *
 * El glow vive en un wrapper EXTERIOR opaco (mismo mecanismo que `cardGlow`/
 * `cardShadow` en las pantallas de auth) — shadow* directo sobre un view con
 * `backgroundColor` translúcido rompe en Android (sombra cuadrada / se recorta).
 */
export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, leftIcon, rightIcon, onRightIconPress, secureTextEntry, ...rest }, ref) => {
    const [hidden, setHidden] = useState(secureTextEntry ?? false);
    const glow = React.useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
      Animated.timing(glow, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    };
    const handleBlur = () => {
      Animated.timing(glow, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    };

    const shadowStyle = {
      shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }),
      shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }),
      elevation: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
    };
    const borderStyle = !error
      ? { borderColor: glow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.1)', '#FF2D6F'] }) }
      : null;

    return (
      <View style={[s.container, containerStyle]}>
        {label ? <Text style={s.label}>{label}</Text> : null}
        <Animated.View style={[s.shadow, shadowStyle]}>
          <Animated.View style={[s.wrap, borderStyle, !!error && s.wrapError]}>
            {leftIcon ? <Ionicons name={leftIcon} size={19} color="rgba(237,234,245,0.55)" style={{ marginRight: 2 }} /> : null}
            <TextInput
              ref={ref}
              style={s.input}
              placeholderTextColor="rgba(237,234,245,0.4)"
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={hidden}
              {...rest}
            />
            {secureTextEntry ? (
              <Pressable onPress={() => setHidden(h => !h)} hitSlop={8} style={s.rightBtn}>
                <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(237,234,245,0.55)" />
              </Pressable>
            ) : rightIcon ? (
              <Pressable onPress={onRightIconPress} hitSlop={8} style={s.rightBtn}>
                <Ionicons name={rightIcon} size={20} color="rgba(237,234,245,0.55)" />
              </Pressable>
            ) : null}
          </Animated.View>
        </Animated.View>
        {error ? <Text style={s.errorText}>{error}</Text> : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const s = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#EDEAF5', letterSpacing: 0.1 },
  shadow: {
    borderRadius: 14,
    backgroundColor: '#0A0910',
    shadowColor: '#FF2D6F',
    shadowOffset: { width: 0, height: 0 },
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    minHeight: 54,
    gap: 8,
  },
  wrapError: { borderColor: '#FF4D4D' },
  input: { flex: 1, fontSize: 15, color: '#EDEAF5', paddingVertical: 12 },
  rightBtn: { paddingLeft: 8 },
  errorText: { fontSize: 12, color: '#FF4D4D', fontWeight: '500' },
});
