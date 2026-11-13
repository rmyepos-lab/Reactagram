import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LearnReelCard, ReelPager, ReelTabs } from '../components/reels';
import { AppText, Chip, Icon, IconButton, Screen, Skeleton } from '../components/ui';
import { AD_RULES, SponsoredReel, interleaveAds, useAdSheet, useAds } from '../features/ads';
import { learnReels, type LearnReel } from '../features/content';
import { orderFeed, progress, useReelTimer } from '../features/progress';
import { settings, useMuted } from '../features/settings';
import { useEndlessFeed } from '../lib/useEndlessFeed';
import type { TabScreenProps } from '../navigation/types';
import { reel as palette } from '../theme';

const FEED = 'learn';
const HEADER_HEIGHT = 64;

export function LearnScreen({ route, navigation }: TabScreenProps<'Learn'>) {
  const { startId, topic } = route.params ?? {};
  // A new start reel or topic builds a fresh feed.
  return (
    <LearnFeed
      key={`${startId ?? ''}|${topic ?? ''}`}
      startId={startId}
      topic={topic}
      onOpenQuiz={() => navigation.navigate('Quiz')}
      onClearTopic={() => navigation.setParams({ topic: undefined, startId: undefined })}
    />
  );
}

type FeedProps = {
  startId?: string;
  topic?: string;
  onOpenQuiz: () => void;
  onClearTopic: () => void;
};

function LearnFeed({ startId, topic, onOpenQuiz, onClearTopic }: FeedProps) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const muted = useMuted();
  const ads = useAds();
  const adSheet = useAdSheet(FEED);
  useReelTimer(focused);

  const nextRound = useCallback((): LearnReel[] => {
    const pool = topic ? learnReels.filter(r => r.topic === topic) : learnReels;
    return orderFeed(pool.length > 0 ? pool : learnReels, progress.get(), new Date(), startId);
  }, [topic, startId]);
  const { items, loadMore } = useEndlessFeed(nextRound);

  const feed = useMemo(
    () =>
      interleaveAds(items, AD_RULES.learnEvery, ads.enabled, (_, id) => !ads.isRemoved(FEED, id)),
    [items, ads],
  );

  const topInset = insets.top + HEADER_HEIGHT;

  return (
    <Screen dark background={palette.background} style={styles.screen}>
      <ReelPager
        data={feed}
        keyOf={item => item.id}
        background={palette.background}
        onNeedMore={loadMore}
        footer={<LoadingReel topInset={topInset} />}
        renderReel={(item, { active }) =>
          item.kind === 'ad' ? (
            <SponsoredReel feed={FEED} slotId={item.id} onOptions={() => adSheet.open(item.id)} />
          ) : (
            <LearnReelCard
              reel={item.item}
              active={active && focused}
              muted={muted}
              topInset={topInset}
            />
          )
        }
      />

      <View style={[styles.header, { top: insets.top }]} pointerEvents="box-none">
        <ReelTabs active="Learn" theme="dark" onChange={onOpenQuiz} />
        <View style={styles.headerRight}>
          {topic ? (
            <Chip
              label={topic}
              size="md"
              background={palette.topicChip}
              color={palette.text}
              onPress={onClearTopic}
              leading={<Icon name="close" size={14} color={palette.text} />}
            />
          ) : null}
          <IconButton
            icon={muted ? 'mute' : 'volume'}
            label={muted ? 'Turn voice-over on' : 'Turn voice-over off'}
            color={palette.text}
            background="rgba(42,45,49,0.9)"
            onPress={settings.toggleMuted}
          />
        </View>
      </View>
      {adSheet.sheet}
    </Screen>
  );
}

function LoadingReel({ topInset }: { topInset: number }) {
  return (
    <View style={[styles.loading, { paddingTop: topInset }]} accessibilityLabel="Loading more reels">
      <Skeleton style={styles.skChips} />
      <Skeleton style={styles.skTitle} />
      <Skeleton style={styles.skCode} />
      <AppText weight="bold" size={13} color={palette.muted}>
        Loading more reels…
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  // The feed runs under the status bar; each reel adds its own top space.
  screen: { paddingTop: 0 },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loading: { flex: 1, paddingHorizontal: 16, gap: 16, backgroundColor: palette.background },
  skChips: { width: 180, height: 28, borderRadius: 14 },
  skTitle: { width: '80%', height: 64 },
  skCode: { height: 180, borderRadius: 24 },
});
