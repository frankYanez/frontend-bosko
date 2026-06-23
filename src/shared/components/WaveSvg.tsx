import React from "react";
import { Dimensions } from "react-native";
import { Svg, Path } from "react-native-svg";
import { TOKENS } from '@/core/design-system/tokens';

const { width } = Dimensions.get("window");

export default function WaveSvg({ color = TOKENS.color.primary }: { color?: string }) {
  return (
    <Svg
      width={width}
      height={150}
      viewBox={`0 0 ${width} 150`}
      style={{ top: 40 }}
    >
      <Path
        d={`
          M0,0 
          C${width * 0.25},80 ${width * 0.75},-80 ${width},60 
          L${width},0 
          Z
        `}
        fill={color}
      />
    </Svg>
  );
}
