import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, durations, easings, radii } from '../theme';

/** A grey stand-in shaped like a PostCard, gently pulsing while the feed loads. */
export function PostSkeleton() {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!reduceMotion) {
      pulse.value = withRepeat(withTiming(0.5, { duration: durations.idle / 2, easing: easings.loop }), -1, true);
    }
  }, [pulse, reduceMotion]);
  const fade = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.card, fade]} accessibilityLabel="Loading post">
      <View style={styles.head}>
        <View style={styles.badge} />
        <View style={styles.lines}>
          <View style={[styles.bar, styles.titleBar]} />
          <View style={[styles.bar, styles.subBar]} />
        </View>
      </View>
      <View style={styles.preview} />
      <View style={styles.actions}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.save]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  badge: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: colors.container },
  lines: { flex: 1, gap: 8 },
  bar: { height: 12, borderRadius: radii.full, backgroundColor: colors.container },
  titleBar: { width: '45%' },
  subBar: { width: '70%', height: 10 },
  preview: { marginHorizontal: 14, height: 150, borderRadius: radii.lg, backgroundColor: colors.container },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 14 },
  dot: { width: 24, height: 24, borderRadius: radii.full, backgroundColor: colors.container },
  save: { marginLeft: 'auto' },
});
