import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { springs } from '../../theme';
import { Icon, PressableScale } from '../ui';

type Props = {
  liked: boolean;
  onToggle: () => void;
  color: string;
  likedColor: string;
  background?: string;
  likedBackground?: string;
  size?: number;
};

/** Heart that pops with a spring when you like something. */
export function LikeButton({
  liked,
  onToggle,
  color,
  likedColor,
  background = 'transparent',
  likedBackground = background,
  size = 48,
}: Props) {
  const pop = useSharedValue(1);
  const heart = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <PressableScale
      accessibilityLabel={liked ? 'Liked. Tap to remove like' : 'Like'}
      accessibilityState={{ selected: liked }}
      pressedScale={0.9}
      onPress={() => {
        if (!liked) {
          pop.value = withSequence(
            withTiming(0.7, { duration: 70 }),
            withSpring(1, springs.bouncy),
          );
        }
        onToggle();
      }}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: liked ? likedBackground : background,
        },
      ]}
    >
      <Animated.View style={heart}>
        <View>
          <Icon name="heart" color={liked ? likedColor : color} filled={liked} />
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
