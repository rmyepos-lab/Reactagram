import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { quizReels, topics } from '../../features/content';
import {
  LEVELS,
  QUIZ_SIZE,
  answeredCount,
  countMatching,
  type Level,
  type QuizConfig,
  type QuizSession,
} from '../../features/quizSession';
import { colors, radii, space } from '../../theme';
import { AppText, Chip, LedgeButton, ProgressBar } from '../ui';

const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
/** Only topics that have at least one question. */
const QUIZ_TOPICS = topics.filter(t => quizReels.some(q => q.topic === t));
/** How many questions each concept chip holds at the picked difficulty ("All" first). */
const topicCounts = (levels: Level[]) => ({
  all: countMatching(quizReels, { levels, topics: [] }),
  byTopic: Object.fromEntries(
    QUIZ_TOPICS.map(t => [t, countMatching(quizReels, { levels, topics: [t] })]),
  ) as Record<string, number>,
});
/** Concepts with no question at the difficulty are hidden, so they can't stay picked. */
const shownOnly = (picked: string[], levels: Level[]) => {
  const { byTopic } = topicCounts(levels);
  return picked.filter(t => byTopic[t] > 0);
};

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter(x => x !== value) : [...list, value];

type Props = {
  /** A quiz the learner left before the end. */
  unfinished: QuizSession | null;
  initial: QuizConfig;
  onStart: (config: QuizConfig) => void;
  onContinue: () => void;
};

/** Before a quiz: pick the difficulty and the concepts, or continue the unfinished quiz. */
export function QuizSetup({ unfinished, initial, onStart, onContinue }: Props) {
  const [levels, setLevels] = useState<Level[]>(initial.levels);
  const [picked, setPicked] = useState<string[]>(() =>
    shownOnly(
      initial.topics.filter(t => QUIZ_TOPICS.includes(t)),
      initial.levels,
    ),
  );
  // A concept hidden by the new difficulty is unpicked too.
  const pickLevels = (next: Level[]) => {
    setLevels(next);
    setPicked(prev => shownOnly(prev, next));
  };

  const config = useMemo<QuizConfig>(() => ({ levels, topics: picked }), [levels, picked]);
  const counts = useMemo(() => topicCounts(levels), [levels]);
  const exact = countMatching(quizReels, config);
  const size = Math.min(QUIZ_SIZE, countMatching(quizReels, { levels: [], topics: picked }));

  // Said only when it matters: nothing to play, or easier/harder questions mixed in.
  const summary =
    size === 0
      ? 'No questions for this choice yet.'
      : exact < size
        ? 'A few questions come from nearby levels.'
        : null;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {unfinished ? (
        <View style={styles.resume}>
          <AppText weight="black" size={18} color={colors.onPrimaryContainer} accessibilityRole="header">
            Continue your quiz
          </AppText>
          <AppText size={14} color={colors.onPrimaryContainer}>
            {answeredCount(unfinished)} of {unfinished.ids.length} answered
          </AppText>
          <ProgressBar
            value={answeredCount(unfinished) / unfinished.ids.length}
            track={colors.primaryTrack}
            label="Quiz progress"
          />
          <LedgeButton label="Continue" onPress={onContinue} height={52} />
        </View>
      ) : null}

      <View style={styles.block}>
        <AppText weight="black" size={24} accessibilityRole="header">
          {unfinished ? 'Or build a new quiz' : 'Build your quiz'}
        </AppText>
        <AppText size={15} color={colors.textMuted}>
          Up to {QUIZ_SIZE} questions. Pick what you want to practice.
        </AppText>
      </View>

      <View style={styles.block}>
        <AppText weight="extrabold" size={16} accessibilityRole="header">
          Difficulty
        </AppText>
        <View style={styles.chips}>
          <Chip label="Any" size="md" selected={levels.length === 0} onPress={() => pickLevels([])} />
          {LEVELS.map(l => (
            <Chip
              key={l}
              label={LEVEL_LABEL[l]}
              size="md"
              selected={levels.includes(l)}
              onPress={() => pickLevels(toggle(levels, l))}
            />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <AppText weight="extrabold" size={16} accessibilityRole="header">
          Concepts
        </AppText>
        <View style={styles.chips}>
          <Chip
            label="All"
            size="md"
            count={counts.all}
            selected={picked.length === 0}
            onPress={() => setPicked([])}
          />
          {QUIZ_TOPICS.filter(t => counts.byTopic[t] > 0).map(t => (
            <Chip
              key={t}
              label={t}
              size="md"
              count={counts.byTopic[t]}
              selected={picked.includes(t)}
              onPress={() => setPicked(prev => toggle(prev, t))}
            />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        {summary ? (
          <AppText size={14} color={colors.textVariant} accessibilityLiveRegion="polite">
            {summary}
          </AppText>
        ) : null}
        <LedgeButton
          label={unfinished ? 'Start a new quiz' : 'Start quiz'}
          onPress={() => onStart(config)}
          disabled={size === 0}
          height={56}
          accessibilityHint={unfinished ? 'Replaces your unfinished quiz' : undefined}
        />
        {unfinished ? (
          <AppText size={13} color={colors.textMuted} style={styles.center}>
            A new quiz replaces the unfinished one.
          </AppText>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xl * 2 },
  resume: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.xl,
    padding: space.lg,
    gap: space.md,
  },
  block: { gap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  center: { textAlign: 'center' },
});
