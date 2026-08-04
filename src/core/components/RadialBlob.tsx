import React, { useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

export function RadialBlob({
  size,
  color,
  opacity = 1,
  style,
}: {
  size: number;
  color: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const id = useRef(`blob-${Math.random().toString(36).slice(2)}`).current;

  return (
    <Svg width={size} height={size} style={style} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.5" stopColor={color} stopOpacity={opacity * 0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}
