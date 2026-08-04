import React from 'react';
import { View, ViewProps, ViewStyle, Pressable } from 'react-native';
import { BlurView } from '@/core/components/BlurView';
import { TOKENS } from '../tokens';
import { SPACING, SpacingKey } from '../spacing';

export interface CardProps extends ViewProps {
  padding?: SpacingKey;
  radius?: keyof typeof TOKENS.radius;
  bordered?: boolean;
  elevated?: boolean;
  onPress?: () => void;
}

/**
 * Surface — "Señal Nocturna": vidrio translúcido (`rgba(255,255,255,0.045)`)
 * con `BlurView` detrás, en vez del panel sólido `tc.card` anterior. `elevated`
 * ahora usa el glow rosa (`TOKENS.shadow.glow`) en vez de la sombra negra
 * genérica — reservalo para cards que "flotan" (listing, modal), no para
 * filas de lista comunes (esas van solo con `bordered`).
 */
export function Card({
  padding = 'lg',
  radius = 'md',
  bordered = true,
  elevated = false,
  onPress,
  style,
  children,
  ...rest
}: CardProps) {
  const radiusValue = TOKENS.radius[radius];
  const outerStyle: ViewStyle = {
    borderRadius: radiusValue,
    overflow: 'visible',
    ...(elevated ? TOKENS.shadow.glow : null),
  };

  const surfaceStyle: ViewStyle = {
    borderRadius: radiusValue,
    padding: SPACING[padding],
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.045)',
    ...(bordered ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' } : null),
  };

  const surface = (
    <BlurView intensity={16} tint="dark" style={surfaceStyle}>
      {children}
    </BlurView>
  );

  if (onPress) return <Pressable onPress={onPress} style={[outerStyle, style]} {...rest}>{surface}</Pressable>;

  return <View style={[outerStyle, style]} {...rest}>{surface}</View>;
}
