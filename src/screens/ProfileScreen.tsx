import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AppText, Icon, LedgeButton, ListRow, ProgressBar, Screen, TextField } from '../components/ui';
import { APP_NAME, HELP_URL } from '../config/app';
import { learnReels, quizReels, topics } from '../features/content';
import { LICENSE_MESSAGES, pro, useIsPro } from '../features/pro';
import { quizAccuracy, useProgress } from '../features/progress';
import type { TabScreenProps } from '../navigation/types';
import { colors, radii } from '../theme';

const ALL = [...learnReels, ...quizReels];

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const p = useProgress();
  const accuracy = quizAccuracy(p);
  const reviews = Object.keys(p.review).length;

  const byTopic = useMemo(
    () =>
      topics.map(topic => {
        const items = ALL.filter(r => r.topic === topic);
        const done = items.filter(r => p.seen.includes(r.id)).length;
        return { topic, done, total: items.length };
      }),
    [p.seen],
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.ring}>
            <View style={styles.avatar}>
              <AppText weight="black" size={24} color={colors.onPrimaryContainer}>
                Y
              </AppText>
            </View>
          </View>
          <View>
            <AppText accessibilityRole="header" weight="black" size={22}>
              You
            </AppText>
            <AppText weight="bold" size={13.5} color={colors.textMuted}>
              React track
            </AppText>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value={String(p.streak)} label="day streak" bg={colors.streakContainer} fg="#5A2208" />
          <Stat value={String(p.xp)} label="XP" bg={colors.primaryContainer} fg={colors.onPrimaryContainer} />
          <Stat
            value={accuracy === null ? '–' : `${Math.round(accuracy * 100)}%`}
            label="quiz accuracy"
            bg={colors.proContainer}
            fg={colors.onProContainer}
          />
        </View>

        {reviews > 0 ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.review}>
            <Icon name="clock" size={18} color={colors.onTip} />
            <AppText weight="extrabold" size={13.5} color={colors.onTip} style={styles.flex}>
              {reviews === 1 ? '1 quiz comes' : `${reviews} quizzes come`} back for review
            </AppText>
          </Animated.View>
        ) : null}

        <View style={styles.section}>
          <AppText accessibilityRole="header" weight="black" size={17}>
            Progress by topic
          </AppText>
          {byTopic.map(({ topic, done, total }) => (
            <View key={topic} style={styles.topicRow} accessible accessibilityLabel={`${topic}: ${done} of ${total} done`}>
              <AppText weight="extrabold" size={14} style={styles.topicName} numberOfLines={1}>
                {topic}
              </AppText>
              <View style={styles.flex}>
                <ProgressBar value={total ? done / total : 0} />
              </View>
              <AppText weight="extrabold" size={12.5} color={colors.textMuted} style={styles.topicCount}>
                {done}/{total}
              </AppText>
            </View>
          ))}
        </View>

        <ProCard />

        <View style={styles.rows}>
          {HELP_URL ? (
            <ListRow
              icon="help"
              label="Help & guide"
              trailing="docs"
              hint="Opens the help website"
              onPress={() => Linking.openURL(HELP_URL).catch(() => undefined)}
            />
          ) : null}
          <ListRow icon="mail" label="Contact us" onPress={() => navigation.navigate('Contact')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label, bg, fg }: { value: string; label: string; bg: string; fg: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]} accessible accessibilityLabel={`${value} ${label}`}>
      <AppText weight="black" size={22} color={fg}>
        {value}
      </AppText>
      <AppText weight="extrabold" size={12.5} color={fg}>
        {label}
      </AppText>
    </View>
  );
}

/**
 * Pro key activation. Play policy: this card must never show a price, a buy button,
 * a purchase link or text that explains how to buy.
 */
function ProCard() {
  const isPro = useIsPro();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = async () => {
    setBusy(true);
    setError(null);
    const result = await pro.activate(key);
    setBusy(false);
    if (!result.ok) {
      setError(LICENSE_MESSAGES[result.reason]);
    }
  };

  return (
    <View style={styles.pro}>
      <AppText accessibilityRole="header" weight="black" size={18} color="#2A1A50">
        {APP_NAME} Pro
      </AppText>
      {isPro ? (
        <Animated.View entering={ZoomIn.springify()} style={styles.proActive}>
          <Icon name="check" size={20} strokeWidth={3} color={colors.onProContainer} />
          <AppText weight="extrabold" size={14.5} color={colors.onProContainer}>
            Pro is active. Ads are off.
          </AppText>
        </Animated.View>
      ) : (
        <>
          <AppText weight="bold" size={13.5} color={colors.onProContainer}>
            Have a {APP_NAME} Pro key? Activate it here.
          </AppText>
          <TextField
            label="License key"
            value={key}
            onChangeText={text => {
              setKey(text);
              setError(null);
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            autoCorrect={false}
            mono
            error={error}
            borderColor={colors.proOutline}
            labelColor={colors.onProContainer}
          />
          <LedgeButton
            label={busy ? 'Checking…' : 'Activate'}
            tone="pro"
            uppercase={false}
            height={48}
            radius={14}
            disabled={busy || key.trim().length === 0}
            onPress={activate}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24, gap: 14 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ring: { width: 72, height: 72, borderRadius: 36, padding: 3, backgroundColor: colors.primary },
  avatar: {
    flex: 1,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 12, borderRadius: radii.lg },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.tip,
  },
  section: { gap: 10 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topicName: { width: 104 },
  topicCount: { width: 34, textAlign: 'right' },
  pro: { padding: 16, gap: 10, borderRadius: radii.xxl, backgroundColor: colors.proTint },
  proActive: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rows: { gap: 8 },
});
