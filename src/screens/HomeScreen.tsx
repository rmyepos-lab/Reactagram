import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Logo } from '../components/Logo';
import { PostCard } from '../components/PostCard';
import { StoryRing } from '../components/StoryRing';
import { AppText, Icon, LedgeButton, ProgressBar, Screen } from '../components/ui';
import { APP_NAME, DAILY_GOAL_MINUTES } from '../config/app';
import { AD_RULES, SponsoredPost, interleaveAds, useAdSheet, useAds, type FeedItem } from '../features/ads';
import { learnReels, quizReels, topics, type LearnReel, type QuizReel } from '../features/content';
import { useProgress } from '../features/progress';
import { dayKey } from '../lib/date';
import type { TabScreenProps } from '../navigation/types';
import { colors, radii } from '../theme';

const FEED = 'home';
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

const shortOf = (topic: string) => (topic.length <= 5 ? topic : topic.replace(/^use/, '').slice(0, 5));

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const p = useProgress();
  const ads = useAds();
  const adSheet = useAdSheet(FEED);

  const minutes = p.lastActiveDay === dayKey() ? Math.floor(p.secondsToday / 60) : 0;
  const nextReel = learnReels.find(r => !p.seen.includes(r.id)) ?? learnReels[0];

  const feed = useMemo(
    () => interleaveAds(POSTS, AD_RULES.homeEvery, ads.enabled, (_, id) => !ads.isRemoved(FEED, id)),
    [ads],
  );

  const open = (post: Post) =>
    navigation.navigate(post.kind === 'learn' ? 'Learn' : 'Quiz', { startId: post.id });

  const header = (
    <View style={styles.top}>
      <Animated.View entering={FadeInDown.duration(320)} style={styles.goal}>
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
        <LedgeButton
          label={`Continue: ${nextReel.topic}`}
          onPress={() => navigation.navigate('Learn', { startId: nextReel.id })}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(320)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
          {topics.map(topic => (
            <StoryRing
              key={topic}
              label={topic}
              short={shortOf(topic)}
              fresh={learnReels.some(r => r.topic === topic && !p.seen.includes(r.id))}
              onPress={() => navigation.navigate('Learn', { topic })}
            />
          ))}
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
  goal: { padding: 16, gap: 12, borderRadius: radii.xxl, backgroundColor: colors.primaryTint },
  goalHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  stories: { gap: 8, paddingRight: 16 },
});
