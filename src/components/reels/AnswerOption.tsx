import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, radii, springs } from '../../theme';
import { AppText, Icon, PressableScale } from '../ui';

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'dimmed';

type Props = {
  letter: string;
  text: string;
  state: AnswerState;
  /** True when this is the option the user picked. */
  picked: boolean;
  onPress: () => void;
};

const LOOK = {
  idle: { bg: colors.card, border: colors.border, fg: colors.text, badge: colors.container, badgeFg: colors.textVariant },
  correct: { bg: colors.correctContainer, border: colors.correct, fg: colors.onCorrectContainer, badge: colors.correct, badgeFg: colors.white },
  wrong: { bg: colors.wrongContainer, border: colors.wrong, fg: colors.onWrongContainer, badge: colors.wrong, badgeFg: colors.white },
  dimmed: { bg: colors.card, border: colors.border, fg: colors.outline, badge: colors.container, badgeFg: colors.outline },
} as const;

/** One quiz answer. It pops when right and shakes when wrong. */
export function AnswerOption({ letter, text, state, picked, onPress }: Props) {
  const look = LOOK[state];
  const shift = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (state === 'wrong') {
      shift.value = withSequence(
        withTiming(-7, { duration: 50 }),
        withTiming(7, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    } else if (state === 'correct') {
      scale.value = withSequence(withTiming(1.04, { duration: 90 }), withSpring(1, springs.bouncy));
    }
  }, [state, shift, scale]);

  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value }, { scale: scale.value }],
  }));

  const note = state === 'correct' ? 'Correct' : state === 'wrong' ? 'Your answer' : '';

  return (
    <Animated.View style={motion}>
      <PressableScale
        onPress={onPress}
        disabled={state !== 'idle'}
        pressedScale={0.98}
        accessibilityLabel={`Answer ${letter}: ${text}${note ? `. ${note}` : ''}`}
        accessibilityState={{ disabled: state !== 'idle', selected: picked }}
        style={[styles.option, { backgroundColor: look.bg, borderColor: look.border }]}
      >
        <View style={[styles.badge, { backgroundColor: look.badge }]}>
          <AppText weight="black" size={13} color={look.badgeFg}>
            {letter}
          </AppText>
        </View>
        <AppText style={[styles.text, { fontFamily: fonts.extrabold }]} size={16} color={look.fg}>
          {text}
        </AppText>
        {note ? (
          <View style={styles.note}>
            {state === 'correct' ? <Icon name="check" size={18} color={look.fg} strokeWidth={3} /> : null}
            <AppText weight="extrabold" size={12.5} color={look.fg}>
              {note}
            </AppText>
          </View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 2,
  },
  badge: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
