import React from 'react';
import { StyleSheet, View } from 'react-native';
import { previewCode, type LearnReel, type QuizReel } from '../features/content';
import { progress, useProgress } from '../features/progress';
import { colors, fonts, radii, reel as palette } from '../theme';
import { CodeBlock, LikeButton, shareReel } from './reels';
import { AppText, IconButton, PressableScale } from './ui';

/** `onOpen` gets the reel, so one stable function serves every card and `memo` can skip re-renders. */
type Props = { reel: LearnReel | QuizReel; onOpen: (reel: LearnReel | QuizReel) => void };

/** Home feed post: a preview of a Learn or Quiz reel with like, share and save. */
export const PostCard = React.memo(function PostCardBase({ reel, onOpen }: Props) {
  const liked = useProgress(p => p.liked.includes(reel.id));
  const saved = useProgress(p => p.saved.includes(reel.id));
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
        <LikeButton
          liked={liked}
          onToggle={() => progress.toggleLike(reel.id)}
          color={colors.text}
          likedColor={colors.wrong}
        />
        <IconButton icon="share" label="Share" onPress={() => shareReel(title, reel.sourceUrl)} />
        <IconButton
          icon="bookmark"
          label={saved ? 'Saved. Tap to remove' : 'Save'}
          selected={saved}
          filled={saved}
          onPress={() => progress.toggleSave(reel.id)}
          style={styles.save}
        />
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
  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2 },
  save: { marginLeft: 'auto' },
});
