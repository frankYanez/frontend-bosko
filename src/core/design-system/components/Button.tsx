import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { GRADIENTS } from '../gradients';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  /** Icono a la izquierda del label — pasar el elemento ya armado, ej. `<MaterialIcons name="send" size={18} color="#fff" />` */
  icon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_H = { sm: 38, md: 48, lg: 56 } as const;
const SIZE_PAD = { sm: SPACING.md, md: SPACING.lg, lg: SPACING.xl } as const;

export function Button({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const tc = useThemeColors();
  const isDisabled = disabled || loading;
  const height = SIZE_H[size];

  const shell: ViewStyle = {
    height,
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SIZE_PAD[size],
    borderRadius: TOKENS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
    ...(fullWidth ? { width: '100%' } : null),
  };

  const textColor =
    variant === 'outline' || variant === 'ghost' ? tc.primary : '#fff';

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <>
      {icon}
      <Text variant="button" color={textColor}>{label}</Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <View style={[styles.shadowWrap, fullWidth && { width: '100%' }]}>
        <Pressable disabled={isDisabled} {...rest} style={[styles.pressable, fullWidth && { width: '100%' }, style]}>
          <LinearGradient colors={GRADIENTS.brand} style={shell}>
            {content}
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        disabled={isDisabled}
        {...rest}
        style={[shell, { backgroundColor: '#ef4444' }, style]}
      >
        {content}
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        disabled={isDisabled}
        {...rest}
        style={[shell, { backgroundColor: tc.surface2 }, style]}
      >
        {loading ? <ActivityIndicator color={tc.text} /> : <>{icon}<Text variant="button" color={tc.text}>{label}</Text></>}
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        disabled={isDisabled}
        {...rest}
        style={[shell, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: tc.primary }, style]}
      >
        {content}
      </Pressable>
    );
  }

  // ghost
  return (
    <Pressable
      disabled={isDisabled}
      {...rest}
      style={[shell, { backgroundColor: 'transparent' }, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: TOKENS.radius.md, ...TOKENS.shadow.button },
  pressable: { borderRadius: TOKENS.radius.md, overflow: 'hidden' },
});
