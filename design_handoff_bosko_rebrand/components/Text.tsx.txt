import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { TYPE_SCALE } from '../typography';
import { useThemeColors } from '@/stores/theme.store';

type Variant = keyof typeof TYPE_SCALE;

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  center?: boolean;
}

/**
 * Sin cambios de comportamiento respecto al archivo original — solo consume
 * el nuevo `TYPE_SCALE` (Archivo Expanded en h1/h2 con `textTransform:
 * 'uppercase'`, nuevo rol `meta` en JetBrains Mono para ratings/timestamps/IDs).
 */
export function Text({ variant = 'body', color, weight, center, style, ...rest }: AppTextProps) {
  const tc = useThemeColors();
  const preset = TYPE_SCALE[variant];

  return (
    <RNText
      style={[
        preset,
        { color: color ?? tc.text },
        weight ? { fontWeight: weight } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}
