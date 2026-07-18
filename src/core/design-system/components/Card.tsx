import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { TOKENS } from '../tokens';
import { SPACING, SpacingKey } from '../spacing';
import { useThemeColors } from '@/stores/theme.store';

export interface CardProps extends ViewProps {
  padding?: SpacingKey;
  radius?: keyof typeof TOKENS.radius;
  bordered?: boolean;
  elevated?: boolean;
}

/**
 * Surface theme-aware: bg tc.card, border tc.cardBorder. Reemplaza el patrón
 * repetido `{ backgroundColor: tc.card, borderColor: tc.cardBorder, borderRadius, ... }`
 * que cada pantalla arma a mano.
 */
export function Card({
  padding = 'lg',
  radius = 'md',
  bordered = true,
  elevated = false,
  style,
  ...rest
}: CardProps) {
  const tc = useThemeColors();

  const cardStyle: ViewStyle = {
    backgroundColor: tc.card,
    borderRadius: TOKENS.radius[radius],
    padding: SPACING[padding],
    ...(bordered ? { borderWidth: 1, borderColor: tc.cardBorder } : null),
    ...(elevated ? TOKENS.shadow.card : null),
  };

  return <View style={[cardStyle, style]} {...rest} />;
}
