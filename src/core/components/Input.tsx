import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '@/core/design-system/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, rightIcon, onRightIconPress, secureTextEntry, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(secureTextEntry ?? false);

    return (
      <View style={[s.container, containerStyle]}>
        {label ? <Text style={s.label}>{label}</Text> : null}
        <View style={[s.wrap, focused && s.wrapFocused, !!error && s.wrapError]}>
          <TextInput
            ref={ref}
            style={s.input}
            placeholderTextColor={TOKENS.color.sub}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            secureTextEntry={hidden}
            {...rest}
          />
          {secureTextEntry ? (
            <Pressable onPress={() => setHidden(h => !h)} hitSlop={8} style={s.rightBtn}>
              <Ionicons
                name={hidden ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={TOKENS.color.sub}
              />
            </Pressable>
          ) : rightIcon ? (
            <Pressable onPress={onRightIconPress} hitSlop={8} style={s.rightBtn}>
              <Ionicons name={rightIcon} size={20} color={TOKENS.color.sub} />
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={s.errorText}>{error}</Text> : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const s = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TOKENS.color.text,
    letterSpacing: 0.1,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7FA',
    borderRadius: TOKENS.radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    minHeight: 50,
  },
  wrapFocused: {
    borderColor: TOKENS.color.primary,
    backgroundColor: '#fff',
  },
  wrapError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff8f8',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.color.text,
    paddingVertical: 12,
  },
  rightBtn: { paddingLeft: 8 },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
});
