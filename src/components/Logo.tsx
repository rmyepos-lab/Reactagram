import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

/** The Hookd mark: a hook with a small play triangle. Same drawing as the splash icon. */
export function Logo({ size = 28, color = colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Circle cx={13} cy={3.6} r={1.7} fill="none" stroke={color} strokeWidth={2.2} />
      <Path
        d="M13 5.3V14a4.5 4.5 0 0 1-9 0v-1.5l2.2 1.6"
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 12.2 21 15l-5 2.8z" fill="#F2A23A" />
    </Svg>
  );
}
