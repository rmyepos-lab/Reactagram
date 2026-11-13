import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AD_RULES } from '../../features/ads/policy';
import { colors, radii } from '../../theme';
import { AppText } from '../ui';

type Props = {
  /** Results of the current block of quizzes: true, false, or undefined if not answered. */
  results: readonly (boolean | undefined)[];
};

/** Shows how close the learner is to skipping the next ad. */
export function SmartSkipChip({ results }: Props) {
  const right = results.filter(r => r === true).length;
  const left = Math.max(0, AD_RULES.quizSkipAt - right);
  const label =
    left === 0
      ? 'Smart Skip: next ad skipped'
      : `Smart Skip: ${right} right so far. ${left} more to skip the next ad.`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.chip}>
      <View style={styles.dots}>
        {Array.from({ length: AD_RULES.quizBlock }, (_, i) => {
          const r = results[i];
          return (
            <View
              key={i}
              style={[
                styles.dot,
                r === true && { backgroundColor: colors.correct },
                r === false && { backgroundColor: colors.wrong },
                r === undefined && styles.empty,
              ]}
            />
          );
        })}
      </View>
      <AppText weight="extrabold" size={12.5} color={colors.textVariant}>
        Skip ad
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.container,
  },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { borderWidth: 2, borderColor: colors.outline },
});
