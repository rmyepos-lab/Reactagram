import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { QuizReelCard, ReelPager, ReelTabs, SmartSkipChip, type ReelPagerHandle } from '../components/reels';
import { Screen } from '../components/ui';
import {
  AD_RULES,
  SponsoredReel,
  earnsSmartSkip,
  interleaveAds,
  useAdSheet,
  useAds,
} from '../features/ads';
import { quizReels, type QuizReel } from '../features/content';
import { orderFeed, progress, useReelTimer } from '../features/progress';
import { useMuted } from '../features/settings';
import { useEndlessFeed } from '../lib/useEndlessFeed';
import type { TabScreenProps } from '../navigation/types';
import { colors } from '../theme';

const FEED = 'quiz';
const slotIdOf = (block: number) => `ad-${block}`;

export function QuizScreen({ route, navigation }: TabScreenProps<'Quiz'>) {
  const startId = route.params?.startId;
  return <QuizFeed key={startId ?? ''} startId={startId} onOpenLearn={() => navigation.navigate('Learn')} />;
}

function QuizFeed({ startId, onOpenLearn }: { startId?: string; onOpenLearn: () => void }) {
  const focused = useIsFocused();
  const muted = useMuted();
  const ads = useAds();
  const adSheet = useAdSheet(FEED);
  const pager = useRef<ReelPagerHandle>(null);
  useReelTimer(focused);

  const nextRound = useCallback(
    (): QuizReel[] => orderFeed(quizReels, progress.get(), new Date(), startId),
    [startId],
  );
  const { items, loadMore } = useEndlessFeed(nextRound);

  /** Answers of this session, by feed key. */
  const [results, setResults] = useState<Record<string, boolean>>({});
  /** Ad slots the learner earned skipping, and slots already shown (those stay). */
  const [earned, setEarned] = useState<ReadonlySet<string>>(new Set());
  const reached = useRef(new Set<string>());
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const blockResults = useCallback(
    (block: number, all: Record<string, boolean>) =>
      items
        .slice(block * AD_RULES.quizBlock, (block + 1) * AD_RULES.quizBlock)
        .map(({ key }) => all[key]),
    [items],
  );

  const onAnswered = (key: string, correct: boolean) => {
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
        (_, id) => !ads.isRemoved(FEED, id) && !earned.has(id),
      ),
    [items, ads, earned],
  );

  const activeIndex = Math.max(0, items.findIndex(i => i.key === activeKey));
  const activeBlock = Math.floor(activeIndex / AD_RULES.quizBlock);

  return (
    <Screen>
      <View style={styles.header}>
        <ReelTabs active="Quiz" theme="light" onChange={onOpenLearn} />
        {ads.enabled ? <SmartSkipChip results={blockResults(activeBlock, results)} /> : null}
      </View>
      <ReelPager
        ref={pager}
        data={feed}
        keyOf={item => item.id}
        background={colors.surface}
        onNeedMore={loadMore}
        onActiveChange={item => {
          if (item.kind === 'ad') {
            reached.current.add(item.id);
          } else {
            setActiveKey(item.id);
          }
        }}
        renderReel={(item, { active }) =>
          item.kind === 'ad' ? (
            <SponsoredReel feed={FEED} slotId={item.id} onOptions={() => adSheet.open(item.id)} />
          ) : (
            <QuizReelCard
              quiz={item.item}
              active={active && focused}
              muted={muted}
              onAnswered={correct => onAnswered(item.id, correct)}
              onNext={() => pager.current?.next()}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
