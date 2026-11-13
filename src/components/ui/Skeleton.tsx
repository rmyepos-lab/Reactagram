import React, { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = { style?: StyleProp<ViewStyle>; color?: string };

/** Pulsing placeholder block shown while content loads. */
export function Skeleton({ style, color = '#2A2D31' }: Props) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.block, { backgroundColor: color }, style, pulse]} />;
}

const styles = StyleSheet.create({ block: { borderRadius: 12 } });
