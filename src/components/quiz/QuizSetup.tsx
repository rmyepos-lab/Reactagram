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
    initial.topics.filter(t => QUIZ_TOPICS.includes(t)),
  );

  const config = useMemo<QuizConfig>(() => ({ levels, topics: picked }), [levels, picked]);
  const exact = countMatching(quizReels, config);
  const size = Math.min(QUIZ_SIZE, countMatching(quizReels, { levels: [], topics: picked }));

  let summary = 'No questions for this choice yet.';
  if (size > 0) {
    const noun = size === 1 ? 'question' : 'questions';
    summary =
      exact < size
        ? `${size} ${noun}: ${exact} at this difficulty, the rest from the nearest levels.`
        : `${size} ${noun}, none repeated.`;
  }

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
          <Chip label="Any" size="md" selected={levels.length === 0} onPress={() => setLevels([])} />
          {LEVELS.map(l => (
            <Chip
              key={l}
              label={LEVEL_LABEL[l]}
              size="md"
              selected={levels.includes(l)}
              onPress={() => setLevels(prev => toggle(prev, l))}
            />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <AppText weight="extrabold" size={16} accessibilityRole="header">
          Concepts
        </AppText>
        <View style={styles.chips}>
          <Chip label="All" size="md" selected={picked.length === 0} onPress={() => setPicked([])} />
          {QUIZ_TOPICS.map(t => (
            <Chip
              key={t}
              label={t}
              size="md"
              selected={picked.includes(t)}
              onPress={() => setPicked(prev => toggle(prev, t))}
            />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <AppText size={14} color={colors.textVariant} accessibilityLiveRegion="polite">
          {summary}
        </AppText>
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
