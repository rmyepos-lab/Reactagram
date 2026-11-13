import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, reel } from '../../theme';
import { AppText, PressableScale } from '../ui';

type Kind = 'Learn' | 'Quiz';
type Props = {
  active: Kind;
  onChange: (kind: Kind) => void;
  /** Dark for the Learn feed, light for the Quiz feed. */
  theme: 'dark' | 'light';
};

const THEMES = {
  dark: { track: 'rgba(42,45,49,0.9)', on: reel.text, onText: reel.background, off: reel.chipText },
  light: { track: colors.containerHigh, on: colors.ink, onText: colors.surface, off: colors.textVariant },
} as const;

/** The Learn | Quiz switch at the top of both reel feeds. */
export function ReelTabs({ active, onChange, theme }: Props) {
  const t = THEMES[theme];
  return (
    <View accessibilityRole="tablist" style={[styles.track, { backgroundColor: t.track }]}>
      {(['Learn', 'Quiz'] as const).map(kind => {
        const selected = kind === active;
        return (
          <PressableScale
            key={kind}
            accessibilityRole="tab"
            accessibilityLabel={`${kind} reels`}
            accessibilityState={{ selected }}
            onPress={() => !selected && onChange(kind)}
            hitSlop={4}
            style={[styles.tab, selected && { backgroundColor: t.on }]}
          >
            <AppText
              weight={selected ? 'black' : 'extrabold'}
              size={15}
              color={selected ? t.onText : t.off}
            >
              {kind}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radii.full },
  tab: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
