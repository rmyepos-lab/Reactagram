import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { PostCard } from '../components/PostCard';
import { AppText, Icon, IconButton, Screen } from '../components/ui';
import { learnReels, quizReels, type LearnReel, type QuizReel } from '../features/content';
import { useProgress } from '../features/progress';
import type { RootScreenProps } from '../navigation/types';
import { colors } from '../theme';

type Post = LearnReel | QuizReel;
const byId = new Map<string, Post>([...learnReels, ...quizReels].map(r => [r.id, r]));

/** Lessons and quizzes the learner saved, newest first. */
export function SavedScreen({ navigation }: RootScreenProps<'Saved'>) {
  const saved = useProgress(p => p.saved);
  // Reels removed from the content since they were saved are skipped.
  const posts = useMemo(
    () => [...saved].reverse().flatMap(id => (byId.has(id) ? [byId.get(id)!] : [])),
    [saved],
  );

  const open = useCallback(
    (post: Post) =>
      navigation.navigate('Tabs', {
        screen: post.kind === 'learn' ? 'Learn' : 'Quiz',
        params: { startId: post.id },
      }),
    [navigation],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="back" label="Back" onPress={navigation.goBack} />
        <AppText accessibilityRole="header" weight="black" size={20}>
          Saved
        </AppText>
      </View>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostCard reel={item} onOpen={open} />}
        contentContainerStyle={[styles.list, posts.length === 0 && styles.grow]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bookmark" size={32} color={colors.textMuted} />
            <AppText weight="extrabold" size={16} style={styles.center}>
              Nothing saved yet
            </AppText>
            <AppText size={14} color={colors.textMuted} style={styles.center}>
              Tap the bookmark on a lesson or a quiz to keep it here.
            </AppText>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 14 },
  grow: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  center: { textAlign: 'center' },
});
