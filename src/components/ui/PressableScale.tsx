import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { springs } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while the finger is down. */
  pressedScale?: number;
};

/** Base touchable: springs down a little on press. Use it for every tappable surface. */
export function PressableScale({
  pressedScale = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      onPressIn={e => {
        scale.value = withSpring(pressedScale, springs.press);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        scale.value = withSpring(1, springs.press);
        onPressOut?.(e);
      }}
      style={[style, animated]}
    />
  );
}
