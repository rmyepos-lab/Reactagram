import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { QuizResults } from '../components/quiz/QuizResults';
import { QuizSetup } from '../components/quiz/QuizSetup';
import { QuizReelCard, ReelPager, ReelTabs, SmartSkipChip, type ReelPagerHandle } from '../components/reels';
import { AppText, Icon, IconButton, ProgressBar, Screen } from '../components/ui';
import {
  AD_RULES,
  SponsoredReel,
  type FeedItem,
  earnsSmartSkip,
  interleaveAds,
  useAdSheet,
  useAds,
} from '../features/ads';
import { quizReels, type QuizReel } from '../features/content';
import { useReelTimer } from '../features/progress';
import {
  answeredCount,
  isFinished,
  quizSession,
  remainingIds,
  useQuizSession,
} from '../features/quizSession';
import { useMuted } from '../features/settings';
import type { TabScreenProps } from '../navigation/types';
import { colors, space } from '../theme';

const FEED = 'quiz';
const slotIdOf = (block: number) => `ad-${block}`;
const quizById = new Map(quizReels.map(q => [q.id, q]));
const END_PAGE = { kind: 'end', id: 'end' } as const;
type PlayerItem = FeedItem<QuizReel> | typeof END_PAGE;

/**
 * Quiz tab. A quiz is a set of up to 20 different questions:
 * setup (difficulty + concepts) → questions → results. An unfinished quiz can be continued.
 * `startId` (from Home or Explore) opens that single question instead.
 */
export function QuizScreen({ route, navigation }: TabScreenProps<'Quiz'>) {
  const startId = route.params?.startId;
  const { active, lastConfig } = useQuizSession();
  const [playing, setPlaying] = useState(false);
  const openLearn = () => navigation.navigate('Learn');

  const single = startId ? quizById.get(startId) : undefined;
  if (single) {
    return (
      <QuizPlayer
        key={single.id}
        quizzes={[single]}
        lastLabel="More quizzes"
        onDone={() => navigation.setParams({ startId: undefined })}
        onOpenLearn={openLearn}
      />
    );
  }

  if (active && playing) {
    return (
      <QuizPlayer
        key={active.startedAt}
        quizzes={remainingIds(active).flatMap(id => quizById.get(id) ?? [])}
        done={answeredCount(active)}
        total={active.ids.length}
        lastLabel="See results"
        onDone={() => setPlaying(false)}
        onExit={() => setPlaying(false)}
        onOpenLearn={openLearn}
      />
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <ReelTabs active="Quiz" theme="light" onChange={openLearn} />
      </View>
      {active && isFinished(active) ? (
        <QuizResults
          session={active}
          onNewQuiz={quizSession.clear}
          onOpenLearn={openLearn}
          onOpenLesson={id => navigation.navigate('Learn', { startId: id })}
        />
      ) : (
        <QuizSetup
          key={active?.startedAt ?? 'new'}
          unfinished={active}
          initial={lastConfig}
          onStart={config => setPlaying(quizSession.start(config))}
          onContinue={() => setPlaying(true)}
        />
      )}
    </Screen>
  );
}

type PlayerProps = {
  /** Questions to play now. Read once: answering does not remove a question from the screen. */
  quizzes: QuizReel[];
  /** Questions of the whole quiz answered so far (earlier sittings included). */
  done?: number;
  /** Size of the whole quiz. Without it, no progress bar is shown (single question). */
  total?: number;
  /** Button text of the last question. */
  lastLabel: string;
  /** The learner pressed the button of the last question, or swiped past it. */
  onDone: () => void;
  /** Leave the quiz and keep the progress. */
  onExit?: () => void;
  onOpenLearn: () => void;
};

function QuizPlayer({ quizzes, done = 0, total, lastLabel, onDone, onExit, onOpenLearn }: PlayerProps) {
  const focused = useIsFocused();
  const muted = useMuted();
  const ads = useAds();
  const adSheet = useAdSheet(FEED);
  const pager = useRef<ReelPagerHandle>(null);
  useReelTimer(focused);

  const [items] = useState(() => quizzes.map(q => ({ key: q.id, item: q })));
  const lastKey = items[items.length - 1]?.key;

  /** Answers of this sitting, by question id. */
  const [results, setResults] = useState<Record<string, boolean>>({});
  /** The option picked for each question, so a card that scrolled away comes back answered. */
  const picks = useRef<Record<string, number>>({});
  /** Ad slots the learner earned skipping, and slots already shown (those stay). */
  const [earned, setEarned] = useState<ReadonlySet<string>>(new Set());
  const reached = useRef(new Set<string>());
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const blockResults = (block: number, all: Record<string, boolean>) =>
    items.slice(block * AD_RULES.quizBlock, (block + 1) * AD_RULES.quizBlock).map(({ key }) => all[key]);

  const onAnswered = (key: string, correct: boolean, picked: number) => {
    picks.current[key] = picked;
    quizSession.answer(key, correct);
    const next = { ...results, [key]: correct };
    setResults(next);
    const block = Math.floor(items.findIndex(i => i.key === key) / AD_RULES.quizBlock);
    const slotId = slotIdOf(block);
    if (earnsSmartSkip(blockResults(block, next)) && !reached.current.has(slotId)) {
      setEarned(prev => new Set(prev).add(slotId));
    }
  };

  const feed = useMemo(
    () =>
      interleaveAds(
        items,
        AD_RULES.quizBlock,
        ads.enabled,
        // No ad after the very last question: the results come next.
        (slot, id) =>
          (slot + 1) * AD_RULES.quizBlock < items.length && !ads.isRemoved(FEED, id) && !earned.has(id),
      ),
    [items, ads, earned],
  );

  /**
   * What the learner can reach by swiping: everything up to the first unanswered question.
   * The next question appears only after an answer. When all are answered, a last page
   * follows: swiping onto it ends the quiz.
   */
  const reachable = useMemo<PlayerItem[]>(() => {
    const stop = feed.findIndex(f => f.kind === 'content' && !(f.id in results));
    return stop === -1 ? [...feed, END_PAGE] : feed.slice(0, stop + 1);
  }, [feed, results]);

  const activeIndex = Math.max(0, items.findIndex(i => i.key === activeKey));
  const activeBlock = Math.floor(activeIndex / AD_RULES.quizBlock);

  return (
    <Screen>
      <View style={styles.header}>
        <ReelTabs active="Quiz" theme="light" onChange={onOpenLearn} />
        <View style={styles.headerEnd}>
          {ads.enabled && items.length >= AD_RULES.quizBlock ? (
            <SmartSkipChip results={blockResults(activeBlock, results)} />
          ) : null}
          {onExit ? (
            <IconButton icon="close" label="Leave the quiz. Your progress is saved." onPress={onExit} />
          ) : null}
        </View>
      </View>
      {total ? (
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <ProgressBar value={done / total} height={8} label="Quiz progress" />
          </View>
          <AppText weight="extrabold" size={13} color={colors.textMuted}>
            {done}/{total}
          </AppText>
        </View>
      ) : null}
      <ReelPager
        ref={pager}
        data={reachable}
        keyOf={item => item.id}
        background={colors.surface}
        onActiveChange={item => {
          if (item.kind === 'end') {
            onDone();
          } else if (item.kind === 'ad') {
            reached.current.add(item.id);
          } else {
            setActiveKey(item.id);
          }
        }}
        renderReel={(item, { active }) =>
          item.kind === 'end' ? (
            <View style={styles.end}>
              <Icon name="check" size={40} color={colors.correct} />
              <AppText weight="black" size={22}>
                Quiz complete
              </AppText>
            </View>
          ) : item.kind === 'ad' ? (
            <SponsoredReel feed={FEED} slotId={item.id} onOptions={() => adSheet.open(item.id)} />
          ) : (
            <QuizReelCard
              quiz={item.item}
              active={active && focused}
              muted={muted}
              initialPicked={picks.current[item.id]}
              onAnswered={(correct, picked) => onAnswered(item.id, correct, picked)}
              nextLabel={item.id === lastKey ? lastLabel : undefined}
              onNext={item.id === lastKey ? onDone : () => pager.current?.next()}
            />
          )
        }
      />
      {adSheet.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  headerEnd: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  progressBar: { flex: 1 },
  end: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
});
