import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { colors, radii } from '../../theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

/** A labelled on/off switch row. */
export function ToggleRow({ label, hint, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText weight="extrabold" size={15}>
          {label}
        </AppText>
        {hint ? (
          <AppText weight="bold" size={12.5} leading={1.35} color={colors.textMuted}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.containerHigh, true: colors.primaryTrack }}
        thumbColor={value ? colors.primary : colors.outline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.container,
  },
  text: { flex: 1, gap: 2 },
});
