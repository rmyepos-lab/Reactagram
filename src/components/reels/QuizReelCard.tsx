import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { QuizReel } from '../../features/content';
import { narrate } from '../../features/narration';
import { progress } from '../../features/progress';
import { playSound } from '../../features/sound';
import { colors, radii, reel as palette, springs } from '../../theme';
import { AppText, Chip, Icon, LedgeButton } from '../ui';
import { AnswerOption, type AnswerState } from './AnswerOption';
import { CodeBlock } from './CodeBlock';

type Props = {
  quiz: QuizReel;
  active: boolean;
  muted: boolean;
  /** The option already picked, when the card comes back on screen after scrolling away. */
  initialPicked?: number;
  onAnswered: (correct: boolean, picked: number) => void;
  onNext: () => void;
  /** Button text after answering. The last question of a quiz says "See results". */
  nextLabel?: string;
};

const LETTERS = ['A', 'B', 'C', 'D'];
const FORMAT_LABEL: Record<QuizReel['format'], string> = {
  output: "What's the output?",
  'bug-hunt': 'Find the bug',
  'which-hook': 'Which hook?',
  'true-false': 'True or false?',
  'fill-blank': 'Fill the blank',
};

/** One question per screen: question, answers, then the explanation and Next. */
export const QuizReelCard = React.memo(function QuizReelCardBase({
  quiz,
  active,
  muted,
  initialPicked,
  onAnswered,
  onNext,
  nextLabel = 'Next question',
}: Props) {
  const [picked, setPicked] = useState<number | null>(initialPicked ?? null);
  /** Lines already read aloud: coming back to the card or the tab doesn't repeat them. */
  const spoken = useRef(new Set<string>(initialPicked == null ? [] : [quiz.say, quiz.explainSay]));
  const answered = picked !== null;
  const correct = picked === quiz.answer;

  // Read the question aloud, then the explanation once it is answered.
  useEffect(() => {
    if (!active || muted) {
      return;
    }
    const line = answered ? quiz.explainSay : quiz.say;
    if (spoken.current.has(line)) {
      return;
    }
    spoken.current.add(line);
    return narrate(line, () => undefined);
  }, [active, muted, answered, quiz]);

  const pick = (i: number) => {
    if (answered) {
      return;
    }
    setPicked(i);
    const isRight = i === quiz.answer;
    if (!muted) {
      playSound(isRight ? 'correct' : 'wrong');
    }
    progress.answer(quiz.id, isRight);
    onAnswered(isRight, i);
  };

  const stateOf = (i: number): AnswerState => {
    if (!answered) {
      return 'idle';
    }
    if (i === quiz.answer) {
      return 'correct';
    }
    return i === picked ? 'wrong' : 'dimmed';
  };

  return (
    <View style={styles.card}>
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Chip
          label={`${quiz.topic} · ${FORMAT_LABEL[quiz.format]}`}
          background={colors.primaryContainer}
          color={colors.onPrimaryContainer}
        />
        <AppText accessibilityRole="header" weight="black" size={20} leading={1.3}>
          {quiz.question}
        </AppText>
        {quiz.code ? (
          <CodeBlock code={quiz.code} fontSize={12.5} background={palette.codeAlt} radius={radii.lg} />
        ) : null}

        <View style={styles.answers}>
          {quiz.options.map((option, i) => (
            <AnswerOption
              key={option}
              letter={LETTERS[i]}
              text={option}
              state={stateOf(i)}
              picked={i === picked}
              onPress={() => pick(i)}
            />
          ))}
        </View>

        {answered ? (
          <Animated.View
            entering={FadeInDown.springify()
              .damping(springs.gentle.damping)
              .stiffness(springs.gentle.stiffness)}
            style={styles.explanation}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.explanationHead}>
              <Icon name="bulb" size={20} color={colors.primary} />
              <AppText accessibilityRole="header" weight="black" size={16} style={styles.flex}>
                Explanation
              </AppText>
              <AppText weight="extrabold" size={12} color={colors.textMuted}>
                {correct ? 'Nice one' : 'Review tomorrow'}
              </AppText>
            </View>
            <AppText weight="semibold" size={14.5} leading={1.5} color={colors.textVariant}>
              {quiz.explanation}
            </AppText>
          </Animated.View>
        ) : null}
      </ScrollView>

      {answered ? (
        <Animated.View entering={FadeInDown.delay(120)} style={styles.next}>
          <LedgeButton
            label={nextLabel}
            tone="ink"
            height={54}
            onPress={onNext}
            trailing={<Icon name="down" size={18} color={colors.white} strokeWidth={2.6} />}
          />
        </Animated.View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 14 },
  answers: { gap: 10 },
  explanation: {
    gap: 10,
    padding: 16,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  explanationHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  next: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
});
