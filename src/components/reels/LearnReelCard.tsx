import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { LearnReel } from '../../features/content';
import { narrate } from '../../features/narration';
import { progress } from '../../features/progress';
import { capitalize, clock, speakingSeconds } from '../../lib/format';
import { colors, durations, easings, radii, reel as palette, springs } from '../../theme';
import { AppText, Chip, Icon } from '../ui';
import { ActionRail } from './ActionRail';
import { CodeBlock } from './CodeBlock';
import { VoiceWave } from './VoiceWave';

type Props = {
  reel: LearnReel;
  /** True while this reel is the one on screen. */
  active: boolean;
  muted: boolean;
  /** Space kept free at the top for the header that floats over the feed. */
  topInset: number;
};

const SLIDE_GAP_MS = 350;

/** One narrated lesson: slides advance by themselves, tap to pause. */
export const LearnReelCard = React.memo(function LearnReelCardBase({
  reel,
  active,
  muted,
  topInset,
}: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const slide = reel.slides[index];
  const last = index === reel.slides.length - 1;
  const playing = active && !paused && !finished;

  const duration = useMemo(
    () => reel.slides.reduce((sum, s) => sum + speakingSeconds(s.say), 0),
    [reel],
  );

  // Leaving the reel rewinds it, so it starts fresh when the user comes back.
  useEffect(() => {
    if (!active) {
      setIndex(0);
      setPaused(false);
      setFinished(false);
    }
  }, [active]);

  useEffect(() => {
    if (!playing) {
      return;
    }
    let gap: ReturnType<typeof setTimeout> | null = null;
    const cancel = narrate(
      slide.say,
      () => {
        if (last) {
          progress.markSeen(reel.id);
          setFinished(true);
        } else {
          gap = setTimeout(() => setIndex(i => i + 1), SLIDE_GAP_MS);
        }
      },
      muted,
    );
    return () => {
      cancel();
      if (gap) {
        clearTimeout(gap);
      }
    };
  }, [playing, slide, last, muted, reel.id]);

  const scrub = useSharedValue(0);
  useEffect(() => {
    const target = finished ? 1 : index / reel.slides.length;
    scrub.value = withTiming(target, { duration: durations.base, easing: easings.standard });
  }, [index, finished, reel.slides.length, scrub]);
  const scrubStyle = useAnimatedStyle(() => ({ width: `${scrub.value * 100}%` }));

  const onTap = () => {
    if (finished) {
      setIndex(0);
      setFinished(false);
    } else {
      setPaused(p => !p);
    }
  };

  return (
    <Pressable
      style={styles.card}
      onPress={onTap}
      accessibilityLabel={`Reel: ${reel.title}`}
      accessibilityHint={finished ? 'Double tap to replay' : 'Double tap to pause or play'}
    >
      <View style={[styles.body, { paddingTop: topInset }]}>
        <View style={styles.chips}>
          <Chip label={reel.topic} background={palette.topicChip} color={colors.primaryContainer} />
          <Chip label={capitalize(reel.level)} background={palette.chip} color={palette.chipText} />
          <Chip label={clock(duration)} background={palette.chip} color={palette.chipText} />
        </View>

        <AppText weight="black" size={26} leading={1.2} color={palette.text} style={styles.title}>
          {reel.title}
        </AppText>

        {/* The key restarts the enter animation for every slide. */}
        <Animated.View
          key={index}
          entering={FadeInDown.springify()
            .damping(springs.gentle.damping)
            .stiffness(springs.gentle.stiffness)}
          style={styles.slide}
        >
          {slide.code ? (
            <CodeBlock code={slide.code} highlight={slide.highlight} />
          ) : null}
          {slide.text && slide.type !== 'title' ? (
            <View style={styles.tip}>
              <Icon name="bulb" size={22} color={colors.onTip} />
              <AppText weight="extrabold" size={16} leading={1.35} color={colors.onTip} style={styles.flex}>
                {slide.text}
              </AppText>
            </View>
          ) : null}
        </Animated.View>
      </View>

      <View style={styles.voice}>
        <VoiceWave playing={playing && !muted} />
        <AppText weight="semibold" size={14} leading={1.45} color={palette.textSoft} style={styles.flex}>
          {slide.say}
        </AppText>
      </View>

      <ActionRail id={reel.id} title={reel.title} sourceUrl={reel.sourceUrl} />

      <View style={styles.foot}>
        <AppText weight="bold" size={13} color={palette.muted}>
          Source: react.dev · {finished ? 'swipe up for the next reel' : `${index + 1} of ${reel.slides.length}`}
        </AppText>
      </View>

      {paused || finished ? (
        <Animated.View
          entering={FadeIn.duration(durations.fast)}
          exiting={FadeOut.duration(durations.fast)}
          pointerEvents="none"
          style={styles.overlay}
        >
          <View style={styles.overlayIcon}>
            <Icon name={finished ? 'check' : 'play'} size={34} color={palette.text} filled={!finished} />
          </View>
        </Animated.View>
      ) : null}

      <View style={styles.scrub}>
        <Animated.View style={[styles.scrubFill, scrubStyle]} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: palette.background, overflow: 'hidden' },
  flex: { flex: 1 },
  body: { paddingHorizontal: 16, gap: 16 },
  chips: { flexDirection: 'row', gap: 6 },
  title: { letterSpacing: -0.3 },
  slide: { gap: 16 },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.xl,
    backgroundColor: colors.tip,
  },
  voice: {
    position: 'absolute',
    left: 16,
    right: 76,
    bottom: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(23,25,28,0.88)',
  },
  foot: { position: 'absolute', left: 16, right: 76, bottom: 22 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  overlayIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42,45,49,0.85)',
  },
  scrub: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: palette.chip },
  scrubFill: { height: '100%', backgroundColor: palette.text },
});
