import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeInDown,
  cancelAnimation,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { conceptTitle, lessonForConcept, quizReels } from '../../features/content';
import { evaluate, type Grade, type Level, type QuizSession } from '../../features/quizSession';
import { useMuted } from '../../features/settings';
import { playSound } from '../../features/sound';
import { colors, durations, easings, radii, space } from '../../theme';
import { Mascot, type MascotMood } from '../Mascot';
import { AppText, Chip, Icon, type IconName, LedgeButton, ListRow, ProgressBar } from '../ui';

const HEADLINE: Record<Grade, string> = {
  strong: 'Excellent!',
  fair: 'Good effort!',
  weak: 'Keep practicing!',
};
const DESCRIPTION: Record<Grade, string> = {
  strong: 'Great job! You really know this.',
  fair: 'Good job! A little review and you will have it.',
  weak: 'Nice try. Review the concepts below, then go again.',
};
/** The icon next to the score: a trophy, a thumbs up, or "try again". */
const BADGE: Record<Grade, { icon: IconName; color: string; background: string }> = {
  strong: { icon: 'trophy', color: colors.correct, background: colors.correctContainer },
  fair: { icon: 'thumbsUp', color: colors.streak, background: colors.streakContainer },
  weak: { icon: 'retry', color: colors.primary, background: colors.primaryContainer },
};
const MOOD: Record<Grade, MascotMood> = { strong: 'cheer', fair: 'steady', weak: 'low' };
const GRADE: Record<Grade, { label: string; color: string; background: string; text: string }> = {
  strong: { label: 'Strong', color: colors.correct, background: colors.correctContainer, text: colors.onCorrectContainer },
  fair: { label: 'Getting there', color: colors.streak, background: colors.streakContainer, text: colors.onStreakContainer },
  weak: { label: 'Needs practice', color: colors.wrong, background: colors.wrongContainer, text: colors.onWrongContainer },
};
const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

type Props = {
  session: QuizSession;
  onNewQuiz: () => void;
  onOpenLearn: () => void;
  /** Opens the lesson of a missed concept. */
  onOpenLesson: (reelId: string) => void;
};

/**
 * After the last question: the score, how well each concept area is understood (from the
 * answers of this quiz), the concepts to review, and what to do next.
 */
export function QuizResults({ session, onNewQuiz, onOpenLearn, onOpenLesson }: Props) {
  const result = useMemo(() => evaluate(session, quizReels), [session]);
  const { right, total, grade } = result.overall;
  const missed = total - right;
  const share = total === 0 ? 0 : right / total;

  const window = useWindowDimensions();
  const [viewHeight, setViewHeight] = useState(window.height * 0.75);
  // First screen: the mascot on the top half, the summary and a scroll hint below.
  // The details start just under the fold.
  const fold = viewHeight - space.lg * 2;
  const heroHeight = Math.round(fold / 2);
  const mascotSize = Math.round(Math.min(heroHeight - space.md, window.width - space.lg * 2));
  const badge = BADGE[grade];

  // The hint bobs gently and fades out once the learner scrolls.
  const scrollY = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: durations.idle / 2, easing: easings.loop }), -1, true);
    return () => cancelAnimation(bob);
  }, [bob]);
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });
  const hint = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - scrollY.value / 80),
    transform: [{ translateY: bob.value * 6 }],
  }));

  const muted = useMuted();
  useEffect(() => {
    if (!muted) {
      playSound('finish');
    }
    // Once, when the results appear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onLayout={e => setViewHeight(e.nativeEvent.layout.height)}>
      <View style={[styles.fold, { minHeight: fold }]}>
        <Animated.View entering={FadeInDown} style={[styles.hero, { height: heroHeight }]}>
          <Mascot size={mascotSize} mood={MOOD[grade]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120)} style={styles.summary}>
          <AppText weight="black" size={28} accessibilityRole="header" style={styles.centerText}>
            {HEADLINE[grade]}
          </AppText>
          <AppText size={16} color={colors.textVariant} style={styles.centerText}>
            {DESCRIPTION[grade]}
          </AppText>
          <View style={styles.score} accessible accessibilityLabel={`${right} correct out of ${total}`}>
            <View style={[styles.badge, { backgroundColor: badge.background }]}>
              <Icon name={badge.icon} size={22} color={badge.color} />
            </View>
            <AppText weight="black" size={32} color={colors.primary}>
              {right}/{total}
            </AppText>
            <AppText weight="bold" size={15} color={colors.textMuted}>
              {Math.round(share * 100)}% correct
            </AppText>
          </View>
          <View style={styles.stretch}>
            <ProgressBar value={share} color={colors.correct} label="Correct answers" />
          </View>
          {result.byLevel.length > 1 ? (
            <View style={styles.levels}>
              {result.byLevel.map(l => (
                <Chip key={l.level} label={`${LEVEL_LABEL[l.level]} ${l.right}/${l.total}`} />
              ))}
            </View>
          ) : null}
        </Animated.View>

        <Animated.View style={[styles.hint, hint]} importantForAccessibility="no-hide-descendants">
          <AppText weight="bold" size={13} color={colors.textMuted}>
            Scroll for details
          </AppText>
          <Icon name="down" size={20} color={colors.textMuted} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(240)} style={styles.card}>
        <AppText weight="black" size={18} accessibilityRole="header">
          Your understanding
        </AppText>
        <AppText size={13} color={colors.textMuted}>
          Based on your answers in this quiz.
        </AppText>
        {result.byTopic.map(t => {
          const g = GRADE[t.grade];
          return (
            <View
              key={t.topic}
              style={styles.topic}
              accessible
              accessibilityLabel={`${t.topic}: ${t.right} of ${t.total} correct. ${g.label}.`}>
              <View style={styles.topicHead}>
                <AppText weight="extrabold" size={15} style={styles.fill} numberOfLines={1}>
                  {t.topic}
                </AppText>
                <Chip label={g.label} background={g.background} color={g.text} />
              </View>
              <View style={styles.topicBar}>
                <View style={styles.fill}>
                  <ProgressBar value={t.right / t.total} height={8} color={g.color} />
                </View>
                <AppText weight="extrabold" size={13} color={colors.textMuted}>
                  {t.right}/{t.total}
                </AppText>
              </View>
            </View>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(360)} style={styles.card}>
        <AppText weight="black" size={18} accessibilityRole="header">
          {missed > 0 ? 'Concepts to review' : 'Nothing to review'}
        </AppText>
        {result.missedConcepts.map(concept => {
          const lesson = lessonForConcept(concept);
          return lesson ? (
            <ListRow
              key={concept}
              icon="learn"
              label={conceptTitle(concept)}
              hint="Opens the lesson"
              onPress={() => onOpenLesson(lesson.id)}
            />
          ) : (
            <View key={concept} style={styles.concept}>
              <Icon name="bulb" size={20} color={colors.textMuted} />
              <AppText size={15} color={colors.textVariant} style={styles.fill}>
                {conceptTitle(concept)}
              </AppText>
            </View>
          );
        })}
        {missed === 0 ? (
          <AppText size={15} color={colors.textVariant}>
            Perfect score. Every answer was right.
          </AppText>
        ) : null}
      </Animated.View>

      <View style={styles.buttons}>
        <LedgeButton label="New quiz" onPress={onNewQuiz} height={56} />
        <LedgeButton label="Back to Learn" tone="ink" onPress={onOpenLearn} height={56} />
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    gap: space.md,
  },
  fold: { justifyContent: 'space-between', gap: space.md },
  hero: { alignItems: 'center', justifyContent: 'center' },
  hint: { alignItems: 'center', gap: 2 },
  summary: { alignItems: 'center', gap: space.md, paddingHorizontal: space.sm },
  centerText: { textAlign: 'center' },
  score: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: { width: 40, height: 40, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  stretch: { alignSelf: 'stretch' },
  fill: { flex: 1 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  topic: { gap: space.sm },
  topicHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  topicBar: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  concept: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  buttons: { gap: space.md },
});
