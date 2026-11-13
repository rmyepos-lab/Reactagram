import React from 'react';
import { Text, type TextProps } from 'react-native';
import { colors, fonts } from '../../theme';

export type FontWeight = keyof typeof fonts;

type Props = TextProps & {
  weight?: FontWeight;
  size?: number;
  color?: string;
  /** Line height as a multiple of the font size. */
  leading?: number;
};

/** The only Text the app uses: it applies the bundled fonts and the default ink color. */
export function AppText({
  weight = 'bold',
  size = 15,
  color = colors.text,
  leading,
  style,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color,
          lineHeight: leading ? Math.round(size * leading) : undefined,
        },
        style,
      ]}
    />
  );
}
