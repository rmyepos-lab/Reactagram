import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { AppText, Chip, Icon, PressableScale, Screen } from '../components/ui';
import { learnReels, quizReels, topics, type LearnReel, type QuizReel } from '../features/content';
import { useProgress } from '../features/progress';
import { capitalize } from '../lib/format';
import type { TabScreenProps } from '../navigation/types';
import { colors, fonts, radii } from '../theme';

type Item = LearnReel | QuizReel;
const ALL: readonly Item[] = [...learnReels, ...quizReels];
const titleOf = (item: Item) => (item.kind === 'learn' ? item.title : item.question);

export function ExploreScreen({ navigation }: TabScreenProps<'Explore'>) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const seen = useProgress(p => p.seen);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter(
      item =>
        (!topic || item.topic === topic) &&
        (!q ||
          titleOf(item).toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.tags.some(tag => tag.toLowerCase().includes(q))),
    );
  }, [query, topic]);

  return (
    <Screen>
      <View style={styles.head}>
        <AppText accessibilityRole="header" weight="black" size={24}>
          Explore
        </AppText>
        <View style={styles.search}>
          <Icon name="explore" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search hooks, topics, questions"
            placeholderTextColor={colors.outline}
            accessibilityLabel="Search reels"
            returnKeyType="search"
            autoCorrect={false}
            style={styles.input}
          />
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" size="md" selected={topic === null} onPress={() => setTopic(null)} />
          {topics.map(t => (
            <Chip key={t} label={t} size="md" selected={topic === t} onPress={() => setTopic(t)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AppText weight="bold" size={15} color={colors.textMuted} style={styles.empty}>
            Nothing matches. Try another word or topic.
          </AppText>
        }
        renderItem={({ item }) => {
          const isLearn = item.kind === 'learn';
          return (
            <Animated.View entering={FadeIn.duration(200)} layout={LinearTransition} style={styles.cell}>
              <PressableScale
                onPress={() => navigation.navigate(isLearn ? 'Learn' : 'Quiz', { startId: item.id })}
                accessibilityLabel={`${isLearn ? 'Learn reel' : 'Quiz'}: ${titleOf(item)}`}
                style={[styles.tile, isLearn ? styles.learnTile : styles.quizTile]}
              >
                <View style={styles.tileHead}>
                  <AppText weight="extrabold" size={12} color={isLearn ? colors.primaryContainer : colors.onProContainer}>
                    {isLearn ? 'LEARN' : 'QUIZ'}
                  </AppText>
                  {seen.includes(item.id) ? (
                    <Icon name="check" size={16} strokeWidth={3} color={isLearn ? colors.primaryContainer : colors.onProContainer} />
                  ) : null}
                </View>
                <AppText weight="black" size={16} leading={1.25} color={isLearn ? colors.white : colors.text} numberOfLines={4}>
                  {titleOf(item)}
                </AppText>
                <AppText weight="bold" size={12.5} color={isLearn ? '#A9B0BA' : colors.textMuted} style={styles.meta}>
                  {item.topic} · {capitalize(item.level)}
                </AppText>
              </PressableScale>
            </Animated.View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    backgroundColor: colors.container,
  },
  input: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text, paddingVertical: 0 },
  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  grid: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  row: { gap: 10 },
  cell: { flex: 1 },
  tile: { flex: 1, minHeight: 150, padding: 14, borderRadius: radii.xl, gap: 8 },
  learnTile: { backgroundColor: '#1E2124' },
  quizTile: { backgroundColor: colors.proTint },
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { marginTop: 'auto' },
  empty: { textAlign: 'center', paddingVertical: 40 },
});
