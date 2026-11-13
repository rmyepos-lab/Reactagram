import React from 'react';
import { StyleSheet } from 'react-native';
import { colors, radii } from '../../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  trailing?: IconName;
  hint?: string;
};

/** Full-width row with a leading icon, used in Profile and in sheets. */
export function ListRow({ icon, label, onPress, trailing = 'chevron', hint }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityHint={hint}
      pressedScale={0.98}
      style={styles.row}
    >
      <Icon name={icon} size={22} color={colors.textVariant} />
      <AppText weight="extrabold" size={15} style={styles.label}>
        {label}
      </AppText>
      <Icon name={trailing} size={18} color={colors.textMuted} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.container,
  },
  label: { flex: 1 },
});
