import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, durations, layout, radii } from '../../theme';
import { AppText } from './AppText';

const TONES = {
  primary: { face: colors.primary, ledge: colors.primaryLedge },
  pro: { face: colors.pro, ledge: colors.proLedge },
  ink: { face: colors.ink, ledge: colors.inkLedge },
} as const;

type Props = {
  label: string;
  onPress: () => void;
  tone?: keyof typeof TONES;
  disabled?: boolean;
  height?: number;
  radius?: number;
  uppercase?: boolean;
  /** Shown after the label, for example an arrow icon. */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/** The "pressable" button from the design system: the face sinks onto a 4dp darker ledge. */
export function LedgeButton({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
  height = 52,
  radius = radii.md,
  uppercase = true,
  trailing,
  style,
  accessibilityHint,
}: Props) {
  const sink = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: sink.value }] }));
  const { face: faceColor, ledge } = TONES[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        sink.value = withTiming(layout.ledge, { duration: durations.instant });
      }}
      onPressOut={() => {
        sink.value = withTiming(0, { duration: durations.fast });
      }}
      style={[styles.button, disabled && styles.disabled, style]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { top: layout.ledge, borderRadius: radius, backgroundColor: ledge },
        ]}
      />
      <Animated.View
        style={[
          styles.face,
          { minHeight: height, borderRadius: radius, backgroundColor: faceColor },
          face,
        ]}
      >
        <AppText
          weight="black"
          size={15}
          color={colors.white}
          style={uppercase ? styles.upper : undefined}
          numberOfLines={1}
        >
          {label}
        </AppText>
        {trailing}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingBottom: layout.ledge },
  disabled: { opacity: 0.5 },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  upper: { textTransform: 'uppercase', letterSpacing: 0.3 },
});
