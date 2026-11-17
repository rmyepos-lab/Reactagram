import React, { useCallback, useMemo, useState, useTransition } from 'react';
import { FlatList, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Logo } from '../components/Logo';
import { HomeCard } from '../components/HomeCard';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { StoryRing } from '../components/StoryRing';
import { TopicArt, topicColors } from '../components/TopicArt';
import { Mascot } from '../components/Mascot';
import { AppText, Chip, Icon, ProgressBar, Screen } from '../components/ui';
import { APP_NAME, DAILY_GOAL_MINUTES } from '../config/app';
import { AD_RULES, SponsoredPost, interleaveAds, useAdSheet, useAds, type FeedItem } from '../features/ads';
import { learnReels, quizReels, topics, type LearnReel, type QuizReel } from '../features/content';
import { missedQuestionIds, useProgress } from '../features/progress';
import { QUIZ_SIZE, answeredCount, configLabel, isFinished, useQuizSession } from '../features/quizSession';
import { dayKey } from '../lib/date';
import type { TabScreenProps } from '../navigation/types';
import { colors, radii } from '../theme';

const FEED = 'home';
const STORY_GAP = 8;
type Post = LearnReel | QuizReel;
const QUIZ_IDS = new Set(quizReels.map(q => q.id));

/** Two lessons, then one quiz, and so on. */
const POSTS: { key: string; item: Post }[] = (() => {
  const out: Post[] = [];
  let quiz = 0;
  learnReels.forEach((reel, i) => {
    out.push(reel);
    if (i % 2 === 1 && quiz < quizReels.length) {
      out.push(quizReels[quiz++]);
    }
  });
  out.push(...quizReels.slice(quiz));
  return out.map(item => ({ key: item.id, item }));
})();

/** Placeholder posts shown while a filter change renders. */
function Skeletons() {
  return (
    <View style={styles.skeletons}>
      <PostSkeleton />
      <PostSkeleton />
    </View>
  );
}

/**
 * The feed's topic chips. They keep their own selection, so a tap redraws only this row
 * at once; `onChange` then updates the feed in the background.
 */
const FeedFilters = React.memo(function FeedFiltersBase({
  onChange,
}: {
  onChange: (topic: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const pick = (next: string | null) => {
    setSelected(next);
    onChange(next);
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      <Chip label="All" size="md" count={POSTS.length} selected={selected === null} onPress={() => pick(null)} />
      {topics.map(topic => {
        const tint = topicColors(topic);
        const on = selected === topic;
        return (
          <Chip
            key={topic}
            label={topic}
            size="md"
            count={TOPIC_COUNTS[topic] ?? 0}
            background={tint.fill}
            color={tint.ink}
            selected={on}
            onPress={() => pick(on ? null : topic)}
            leading={
              <TopicArt
                topic={topic}
                size={16}
                color={on ? colors.surface : tint.ink}
                accent={on ? colors.surface : tint.accent}
              />
            }
          />
        );
      })}
    </ScrollView>
  );
});

/** How many feed posts (lessons and quizzes) each topic filter holds. */
const TOPIC_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  POSTS.forEach(({ item }) => {
    counts[item.topic] = (counts[item.topic] ?? 0) + 1;
  });
  return counts;
})();

/** The fox's line under the goal bar. */
const cheer = (minutes: number) =>
  minutes >= DAILY_GOAL_MINUTES
    ? 'Goal done. Nice commit today!'
    : minutes > 0
      ? 'Keep going, almost compiled!'
      : "Let's ship some React today.";

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const p = useProgress();
  const ads = useAds();
  const adSheet = useAdSheet(FEED);

  const { width } = useWindowDimensions();
  // Exactly 4 circles fit: screen minus the list padding (2 x 16) and 3 gaps.
  const storyWidth = Math.floor((width - 32 - 3 * STORY_GAP) / 4);

  const minutes = p.lastActiveDay === dayKey() ? Math.floor(p.secondsToday / 60) : 0;

  const [filter, setFilter] = useState<string | null>(null);
  // The feed re-renders in the background; until it is ready the list shows skeleton posts.
  const [loading, startTransition] = useTransition();
  const changeFilter = useCallback((next: string | null) => startTransition(() => setFilter(next)), []);

  const feed = useMemo(() => {
    const posts = filter ? POSTS.filter(post => post.item.topic === filter) : POSTS;
    return interleaveAds(posts, AD_RULES.homeEvery, ads.enabled, (_, id) => !ads.isRemoved(FEED, id));
  }, [ads, filter]);

  // Topics with a lesson not watched yet, worked out once per change of the seen list.
  const freshTopics = useMemo(
    () => new Set(learnReels.filter(r => !p.seen.includes(r.id)).map(r => r.topic)),
    [p.seen],
  );

  const missedCount = useMemo(
    () => missedQuestionIds(p, new Date(), id => QUIZ_IDS.has(id), QUIZ_SIZE).length,
    // Only the review list decides what is back today.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.review],
  );

  const { active } = useQuizSession();
  const unfinished = active && !isFinished(active) ? active : null;

  const open = useCallback(
    (post: Post) => navigation.navigate(post.kind === 'learn' ? 'Learn' : 'Quiz', { startId: post.id }),
    [navigation],
  );
  const openAdSheet = adSheet.open;
  const renderItem = useCallback(
    ({ item }: { item: FeedItem<Post> }) =>
      item.kind === 'ad' ? (
        <SponsoredPost feed={FEED} slotId={item.id} onOptions={() => openAdSheet(item.id)} />
      ) : (
        <PostCard reel={item.item} onOpen={open} />
      ),
    [open, openAdSheet],
  );

  // Kept as one element so a filter change does not redraw the fox, the circles or the chips.
  const header = useMemo(
    () => (
      <View style={styles.top}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.goal}>
          <Mascot size={80} wave={false} />
          <View style={styles.goalBody}>
            <View style={styles.goalHead}>
              <AppText accessibilityRole="header" weight="black" size={18}>
                Today's goal
              </AppText>
              <AppText weight="extrabold" size={14} color={colors.onPrimaryContainer}>
                {DAILY_GOAL_MINUTES} min
              </AppText>
            </View>
            <ProgressBar
              value={minutes / DAILY_GOAL_MINUTES}
              height={14}
              track={colors.primaryTrack}
              label="Today's goal"
            />
            <AppText weight="bold" size={14} color={colors.textVariant}>
              {cheer(minutes)}
            </AppText>
          </View>
        </Animated.View>

        {unfinished && (
          <HomeCard
            tone="primary"
            icon="play"
            title="Your quiz is waiting"
            line={`${answeredCount(unfinished)} of ${unfinished.ids.length} answered · ${configLabel(unfinished.config)}`}
            progress={answeredCount(unfinished) / unfinished.ids.length}
            button="Continue"
            onPress={() => navigation.navigate('Quiz', { resume: true })}
          />
        )}

        {missedCount > 0 && (
          <HomeCard
            tone="tip"
            icon="retry"
            title={missedCount === 1 ? '1 missed question is back' : `${missedCount} missed questions are back`}
            line="Answer them again to make them stick."
            button="Answer them"
            onPress={() => navigation.navigate('Quiz', { missed: true })}
          />
        )}

        <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText accessibilityRole="header" weight="black" size={18}>
              Topics
            </AppText>
            <AppText weight="bold" size={13} color={colors.textMuted}>
              {topics.length} topics
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={storyWidth + STORY_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.stories}
          >
            {topics.map(topic => (
              <StoryRing
                key={topic}
                label={topic}
                width={storyWidth}
                fresh={freshTopics.has(topic)}
                onPress={() => navigation.navigate('Learn', { topic })}
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(320)} style={styles.section}>
          <AppText accessibilityRole="header" weight="black" size={18}>
            Your feed
          </AppText>
          <FeedFilters onChange={changeFilter} />
        </Animated.View>
      </View>
    ),
    [minutes, unfinished, missedCount, storyWidth, freshTopics, navigation, changeFilter],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Logo />
          <AppText weight="black" size={23} style={styles.brandText}>
            {APP_NAME}
          </AppText>
        </View>
        <View style={styles.stats}>
          <View
            accessible
            accessibilityLabel={`${p.streak} day streak`}
            style={[styles.stat, { backgroundColor: colors.streakContainer }]}
          >
            <Icon name="flame" size={16} color={colors.streak} filled />
            <AppText weight="black" size={15} color={colors.onStreakContainer}>
              {p.streak}
            </AppText>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.primaryContainer }]}>
            <AppText weight="black" size={15} color={colors.onPrimaryContainer}>
              {p.xp} XP
            </AppText>
          </View>
        </View>
      </View>

      <FlatList<FeedItem<Post>>
        // While the feed catches up with the chip just tapped, it shows skeleton posts.
        data={loading ? [] : feed}
        ListEmptyComponent={loading ? Skeletons : undefined}
        keyExtractor={item => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
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
    paddingTop: 10,
    paddingBottom: 6,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { letterSpacing: -0.4 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 14 },
  top: { gap: 14 },
  goal: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderRadius: radii.xxl, backgroundColor: colors.primaryTint },
  goalBody: { flex: 1, gap: 10 },
  goalHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  stories: { gap: STORY_GAP },
  filters: { gap: 8 },
  skeletons: { gap: 14 },
});
