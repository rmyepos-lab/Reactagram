import React from 'react';
import { StyleSheet, View } from 'react-native';
import { previewCode, type LearnReel, type QuizReel } from '../features/content';
import { postStatus, postXp, progress, useProgress, type PostStatus } from '../features/progress';
import { colors, fonts, radii, reel as palette } from '../theme';
import { CodeBlock, shareReel } from './reels';
import { AppText, Icon, IconButton, PressableScale, type IconName } from './ui';

/**
 * The status pill. Only states that invite the learner in get one: a "done" or "missed" mark
 * would make the feed feel used up, so those posts show no pill.
 */
const PILL: Partial<Record<PostStatus, { label: string; bg: string; fg: string; icon?: IconName }>> = {
  new: { label: 'New', bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
  back: { label: 'Back today', bg: colors.tip, fg: colors.onTip, icon: 'retry' },
};

/** `onOpen` gets the reel, so one stable function serves every card and `memo` can skip re-renders. */
type Props = { reel: LearnReel | QuizReel; onOpen: (reel: LearnReel | QuizReel) => void };

/** Home feed post: a preview of a Learn or Quiz reel with share and save. */
export const PostCard = React.memo(function PostCardBase({ reel, onOpen }: Props) {
  const saved = useProgress(p => p.saved.includes(reel.id));
  const status = useProgress(p => postStatus(p, reel, new Date()));
  const pill = PILL[status];
  const xp = postXp(reel.kind, status);
  const isLearn = reel.kind === 'learn';
  const title = isLearn ? reel.title : reel.question;
  const code = isLearn ? previewCode(reel) : reel.code ? { code: reel.code } : null;
  const subtitle = isLearn
    ? `Learn reel · ${reel.slides.length} slides · voice-over`
    : `Quiz · ${reel.options.length} answers`;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.badge, !isLearn && styles.quizBadge]}>
          <AppText style={styles.badgeText} color={isLearn ? colors.onPrimaryContainer : colors.onProContainer}>
            {isLearn ? '{ }' : '?'}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText weight="extrabold" size={15}>
            {reel.topic}
          </AppText>
          <AppText weight="bold" size={12.5} color={colors.textMuted}>
            {subtitle}
          </AppText>
        </View>
      </View>

      <PressableScale
        onPress={() => onOpen(reel)}
        pressedScale={0.98}
        accessibilityLabel={`${isLearn ? 'Watch' : 'Answer'}: ${title}`}
        style={styles.preview}
      >
        <AppText weight="black" size={19} leading={1.25} color={palette.text}>
          {title}
        </AppText>
        {code ? (
          <View pointerEvents="none">
            <CodeBlock
              code={code.code}
              highlight={'highlight' in code ? code.highlight : undefined}
              fontSize={12.5}
              background="transparent"
              radius={0}
            />
          </View>
        ) : null}
      </PressableScale>

      <View style={styles.actions}>
        <IconButton icon="share" label="Share" onPress={() => shareReel(title, reel.sourceUrl)} />
        <IconButton
          icon="bookmark"
          label={saved ? 'Saved. Tap to remove' : 'Save'}
          selected={saved}
          filled={saved}
          onPress={() => progress.toggleSave(reel.id)}
        />
        {xp ? (
          <AppText weight="extrabold" size={12.5} color={colors.textMuted} style={styles.xp}>
            +{xp} XP
          </AppText>
        ) : null}
        {pill ? (
          <View style={[styles.pill, !xp && styles.push, { backgroundColor: pill.bg }]}>
            {pill.icon ? <Icon name={pill.icon} size={14} strokeWidth={3} color={pill.fg} /> : null}
            <AppText weight="extrabold" size={12.5} color={pill.fg}>
              {pill.label}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  quizBadge: { backgroundColor: colors.proContainer },
  badgeText: { fontFamily: fonts.monoBold, fontSize: 13 },
  preview: {
    marginHorizontal: 14,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderRadius: radii.lg,
    backgroundColor: palette.codeAlt,
    overflow: 'hidden',
  },
  actions: { flexDirection: 'row', alignItems: 'center', paddingLeft: 6, paddingRight: 14, paddingVertical: 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  xp: { marginLeft: 'auto', marginRight: 8 },
  push: { marginLeft: 'auto' },
});
