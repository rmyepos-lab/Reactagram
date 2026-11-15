import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { conceptTitle, lessonForConcept, quizReels } from '../../features/content';
import { evaluate, type Grade, type Level, type QuizSession } from '../../features/quizSession';
import { useMuted } from '../../features/settings';
import { playSound } from '../../features/sound';
import { colors, radii, space } from '../../theme';
import { AppText, Chip, Icon, LedgeButton, ListRow, ProgressBar } from '../ui';

const HEADLINE: Record<Grade, string> = {
  strong: 'Excellent!',
  fair: 'Good effort!',
  weak: 'Keep practicing!',
};
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

  const muted = useMuted();
  useEffect(() => {
    if (!muted) {
      playSound('finish');
    }
    // Once, when the results appear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown} style={[styles.card, styles.center]}>
        <AppText weight="black" size={24} accessibilityRole="header">
          {HEADLINE[grade]}
        </AppText>
        <AppText
          weight="black"
          size={56}
          color={colors.primary}
          accessibilityLabel={`${right} correct out of ${total}`}>
          {right}/{total}
        </AppText>
        <View style={styles.stretch}>
          <ProgressBar value={share} color={colors.correct} label="Correct answers" />
        </View>
        <AppText size={15} color={colors.textMuted}>
          {Math.round(share * 100)}% correct
        </AppText>
        {result.byLevel.length > 1 ? (
          <View style={styles.levels}>
            {result.byLevel.map(l => (
              <Chip key={l.level} label={`${LEVEL_LABEL[l.level]} ${l.right}/${l.total}`} />
            ))}
          </View>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
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

      <Animated.View entering={FadeInDown.delay(240)} style={styles.card}>
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
    </ScrollView>
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
  center: { alignItems: 'center' },
  stretch: { alignSelf: 'stretch' },
  fill: { flex: 1 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  topic: { gap: space.sm },
  topicHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  topicBar: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  concept: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  buttons: { gap: space.md },
});
