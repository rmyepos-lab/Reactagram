import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Icon, LedgeButton, ProgressBar, type IconName } from './ui';
import { colors, radii } from '../theme';

const TONES = {
  tip: { background: colors.tip, ink: colors.onTip },
  primary: { background: colors.primaryContainer, ink: colors.onPrimaryContainer },
} as const;

type Props = {
  icon: IconName;
  title: string;
  line: string;
  button: string;
  onPress: () => void;
  tone: keyof typeof TONES;
  /** 0 to 1: shows a progress bar under the text. */
  progress?: number;
};

/** A Home card that leads to one action: missed questions back today, an unfinished quiz. */
export function HomeCard({ icon, title, line, button, onPress, tone, progress }: Props) {
  const { background, ink } = TONES[tone];
  return (
    <Animated.View entering={FadeInDown.duration(320)} style={[styles.card, { backgroundColor: background }]}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Icon name={icon} size={22} color={ink} />
        </View>
        <View style={styles.body}>
          <AppText accessibilityRole="header" weight="black" size={17} color={ink}>
            {title}
          </AppText>
          <AppText weight="bold" size={14} color={ink}>
            {line}
          </AppText>
        </View>
      </View>
      {progress !== undefined && (
        <ProgressBar value={progress} track={colors.primaryTrack} label={title} />
      )}
      <LedgeButton label={button} onPress={onPress} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14, borderRadius: radii.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  body: { flex: 1, gap: 2 },
});
