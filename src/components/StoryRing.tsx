import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, fonts } from '../theme';
import { AppText, PressableScale } from './ui';

type Props = {
  label: string;
  /** Short text inside the circle. */
  short: string;
  /** A colored ring means there is something new to watch. */
  fresh: boolean;
  onPress: () => void;
};

/** Instagram-style story circle for a topic. */
export function StoryRing({ label, short, fresh, onPress }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.92}
      accessibilityLabel={`${label} reels${fresh ? ', new lessons' : ''}`}
      style={styles.story}
    >
      <View style={[styles.ring, { backgroundColor: fresh ? colors.primary : colors.border }]}>
        <View style={styles.inner}>
          <AppText style={styles.short} color={colors.onPrimaryContainer} numberOfLines={1}>
            {short}
          </AppText>
        </View>
      </View>
      <AppText weight="bold" size={12} color={colors.textVariant} numberOfLines={1}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  story: { width: 72, alignItems: 'center', gap: 6 },
  ring: { width: 64, height: 64, borderRadius: 32, padding: 3 },
  inner: {
    flex: 1,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  short: { fontFamily: fonts.monoBold, fontSize: 13 },
});
