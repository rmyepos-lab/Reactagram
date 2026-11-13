import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../../theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  background?: string;
  color?: string;
  /** Makes the chip tappable (filter chips). */
  onPress?: () => void;
  selected?: boolean;
  leading?: React.ReactNode;
  size?: 'sm' | 'md';
};

/** Pill label. With `onPress` it becomes a selectable filter chip (48dp tall touch area). */
export function Chip({
  label,
  background = colors.container,
  color = colors.textVariant,
  onPress,
  selected,
  leading,
  size = 'sm',
}: Props) {
  const bg = selected ? colors.ink : background;
  const fg = selected ? colors.surface : color;
  const body = (
    <View style={[styles.chip, size === 'md' && styles.md, { backgroundColor: bg }]}>
      {leading}
      <AppText weight="extrabold" size={size === 'md' ? 14 : 12.5} color={fg}>
        {label}
      </AppText>
    </View>
  );
  if (!onPress) {
    return body;
  }
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={styles.touch}
    >
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  md: { paddingHorizontal: 16, minHeight: 40 },
  touch: { minHeight: 48, justifyContent: 'center' },
});
