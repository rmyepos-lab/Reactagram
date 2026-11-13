import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { reel } from '../../theme';

function Bar({ delay, playing }: { delay: number; playing: boolean }) {
  const level = useSharedValue(0.4);

  useEffect(() => {
    if (playing) {
      level.value = withDelay(delay, withRepeat(withTiming(1, { duration: 380 }), -1, true));
    } else {
      cancelAnimation(level);
      level.value = withTiming(0.4, { duration: 160 });
    }
  }, [playing, delay, level]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: level.value }] }));
  return <Animated.View style={[styles.bar, style]} />;
}

/** Three bars that move while the narrator is speaking. */
export function VoiceWave({ playing }: { playing: boolean }) {
  return (
    <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no">
      <Bar delay={0} playing={playing} />
      <Bar delay={130} playing={playing} />
      <Bar delay={260} playing={playing} />
    </View>
  );
}

const styles = StyleSheet.create({
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 18, marginTop: 1 },
  bar: { width: 3, height: 16, borderRadius: 2, backgroundColor: reel.accent },
});
