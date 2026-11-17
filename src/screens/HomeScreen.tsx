import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Logo } from '../components/Logo';
import { PostCard } from '../components/PostCard';
import { StoryRing } from '../components/StoryRing';
import { TopicArt, topicColors } from '../components/TopicArt';
import { Mascot } from '../components/Mascot';
import { AppText, Chip, Icon, ProgressBar, Screen } from '../components/ui';
import { APP_NAME, DAILY_GOAL_MINUTES } from '../config/app';
import { AD_RULES, SponsoredPost, interleaveAds, useAdSheet, useAds, type FeedItem } from '../features/ads';
import { learnReels, quizReels, topics, type LearnReel, type QuizReel } from '../features/content';
import { useProgress } from '../features/progress';
import { dayKey } from '../lib/date';
import type { TabScreenProps } from '../navigation/types';
import { colors, radii } from '../theme';

const FEED = 'home';
const STORY_GAP = 8;
type Post = LearnReel | QuizReel;

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

  const feed = useMemo(() => {
    const posts = filter ? POSTS.filter(post => post.item.topic === filter) : POSTS;
    return interleaveAds(posts, AD_RULES.homeEvery, ads.enabled, (_, id) => !ads.isRemoved(FEED, id));
  }, [ads, filter]);

  const open = (post: Post) =>
    navigation.navigate(post.kind === 'learn' ? 'Learn' : 'Quiz', { startId: post.id });

  const header = (
    <View style={styles.top}>
      <Animated.View entering={FadeInDown.duration(320)} style={styles.goal}>
        <Mascot size={80} wave={false} />
        <View style={styles.goalBody}>
          <View style={styles.goalHead}>
            <AppText accessibilityRole="header" weight="black" size={18}>
              Today's goal
            </AppText>
            <AppText weight="extrabold" size={14} color={colors.onPrimaryContainer}>
              {Math.min(minutes, DAILY_GOAL_MINUTES)} of {DAILY_GOAL_MINUTES} min
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
              fresh={learnReels.some(r => r.topic === topic && !p.seen.includes(r.id))}
              onPress={() => navigation.navigate('Learn', { topic })}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(320)} style={styles.section}>
        <AppText accessibilityRole="header" weight="black" size={18}>
          Your feed
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Chip label="All" size="md" selected={filter === null} onPress={() => setFilter(null)} />
          {topics.map(topic => {
            const tint = topicColors(topic);
            const on = filter === topic;
            return (
              <Chip
                key={topic}
                label={topic}
                size="md"
                background={tint.fill}
                color={tint.ink}
                selected={on}
                onPress={() => setFilter(on ? null : topic)}
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
      </Animated.View>
    </View>
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
        data={feed}
        keyExtractor={item => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          item.kind === 'ad' ? (
            <SponsoredPost feed={FEED} slotId={item.id} onOptions={() => adSheet.open(item.id)} />
          ) : (
            <PostCard reel={item.item} onOpen={() => open(item.item)} />
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
});
