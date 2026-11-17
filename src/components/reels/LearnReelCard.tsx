import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  diagramState,
  slideLines,
  TUTOR_MAX,
  tutorPose,
  tutorX,
  type LearnReel,
  type LearnSlide,
} from '../../features/content';
import { narrate } from '../../features/narration';
import { progress } from '../../features/progress';
import { capitalize, clock, speakingSeconds } from '../../lib/format';
import { colors, durations, easings, radii, reel as palette, springs } from '../../theme';
import { AppText, Chip, Icon } from '../ui';
import { Mascot } from '../Mascot';
import { ActionRail } from './ActionRail';
import { CodeBlock } from './CodeBlock';
import { Diagram } from './Diagram';
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
/** The voice-over caption's side insets; the fox tutor walks along the space above it. */
const VOICE_LEFT = 16;
const VOICE_RIGHT = 76;
/** How often the caption types its next letters. */
const TYPE_TICK_MS = 40;
/** The caption finishes typing at this share of the line's estimated speaking time, never behind the voice. */
const TYPE_PACE = 0.85;

/** One narrated lesson: slides advance by themselves, tap to pause. */
export const LearnReelCard = React.memo(function LearnReelCardBase({
  reel,
  active,
  muted,
  topInset,
}: Props) {
  const [index, setIndex] = useState(0);
  /** Which narration line of the slide is playing: 0 is `say`, then one per diagram step. */
  const [part, setPart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  // Where the slide's content ends and the caption starts, measured once per slide: the fox fills the gap.
  const [contentBottom, setContentBottom] = useState<number | null>(null);
  const [captionTop, setCaptionTop] = useState<number | null>(null);
  const slide = reel.slides[index];
  const lines = useMemo(() => slideLines(slide), [slide]);
  const line = lines[part] ?? slide.say;
  const lastLine = part >= lines.length - 1;
  const last = index === reel.slides.length - 1;
  const playing = active && !paused && !finished;
  const diagram = useMemo(
    () => (slide.visual ? diagramState(slide.visual, slide.steps, part) : null),
    [slide, part],
  );

  const duration = useMemo(
    () =>
      reel.slides.reduce(
        (sum, s) => sum + slideLines(s).reduce((t, l) => t + speakingSeconds(l), 0),
        0,
      ),
    [reel],
  );

  // Leaving the reel rewinds it, so it starts fresh when the user comes back.
  useEffect(() => {
    if (!active) {
      setIndex(0);
      setPart(0);
      setPaused(false);
      setFinished(false);
    }
  }, [active]);

  useEffect(() => {
    if (!playing) {
      return;
    }
    let gap: ReturnType<typeof setTimeout> | null = null;
    let cancel = () => {};
    const speak = () => {
      cancel = narrate(
        line,
        () => {
          if (!lastLine) {
            // The next diagram step follows straight on, like one sentence after another.
            setPart(p => p + 1);
          } else if (last) {
            progress.markSeen(reel.id);
            setFinished(true);
          } else {
            gap = setTimeout(() => {
              setPart(0);
              setIndex(i => i + 1);
            }, SLIDE_GAP_MS);
          }
        },
        muted,
        reel.id,
      );
    };
    // A new slide's first line waits for the slide to finish sliding in; diagram steps follow on.
    const start = part === 0 ? setTimeout(speak, durations.slow) : null;
    if (!start) {
      speak();
    }
    return () => {
      if (start) {
        clearTimeout(start);
      }
      cancel();
      if (gap) {
        clearTimeout(gap);
      }
    };
  }, [playing, line, part, lastLine, last, muted, reel.id]);

  const scrub = useSharedValue(0);
  useEffect(() => {
    const target = finished ? 1 : (index + part / lines.length) / reel.slides.length;
    scrub.value = withTiming(target, { duration: durations.base, easing: easings.standard });
  }, [index, part, lines.length, finished, reel.slides.length, scrub]);
  const scrubStyle = useAnimatedStyle(() => ({ width: `${scrub.value * 100}%` }));

  const onTap = () => {
    if (finished) {
      setIndex(0);
      setPart(0);
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
          onLayout={e => setContentBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
        >
          {slide.code ? (
            <CodeBlock code={slide.code} highlight={slide.highlight} />
          ) : null}
          {slide.visual && diagram ? (
            <Diagram diagram={slide.visual} visible={diagram.visible} focus={diagram.focus} />
          ) : null}
          {slide.type === 'title' && slide.text ? (
            <AppText weight="black" size={32} leading={1.2} color={palette.accent} style={styles.title}>
              {slide.text}
            </AppText>
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

      <View style={styles.voice} onLayout={e => setCaptionTop(e.nativeEvent.layout.y)}>
        {/* Only the reel on screen has a fox, so the reels kept around it cost nothing. */}
        {active && contentBottom !== null && captionTop !== null ? (
          <Tutor
            seed={reel.id}
            slide={slide}
            finished={finished}
            moving={playing || finished}
            room={captionTop - contentBottom}
          />
        ) : null}
        <VoiceWave playing={playing && !muted} />
        <TypingCaption line={line} playing={playing} delay={part === 0 ? durations.slow : 0} />
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

/** The fox tutor: greets on the title slide, then steps aside and points at the lesson. */
function Tutor({
  seed,
  slide,
  finished,
  moving,
  room,
}: {
  seed: string;
  slide: LearnSlide;
  finished: boolean;
  moving: boolean;
  /** Free height between the slide's content and the caption. */
  room: number;
}) {
  const { width } = useWindowDimensions();
  const pose = tutorPose(slide, finished, room);
  const x = tutorX(pose, width - VOICE_LEFT - VOICE_RIGHT, TUTOR_MAX);
  const size = pose.size / TUTOR_MAX;
  const left = useSharedValue(x);
  const scale = useSharedValue(size);
  useEffect(() => {
    left.value = withSpring(x, springs.gentle);
    scale.value = withSpring(size, springs.gentle);
  }, [x, size, left, scale]);
  // Scaling shrinks toward the box center; the shift down keeps the fox's feet on the caption.
  const place = useAnimatedStyle(() => ({
    transform: [
      { translateX: left.value },
      { translateY: (TUTOR_MAX * (1 - scale.value)) / 2 },
      { scale: scale.value },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.tutor, place]}>
      <Mascot size={TUTOR_MAX} mood={pose.mood} moving={moving} wave={false} seed={seed} />
    </Animated.View>
  );
}

/**
 * The voice-over line, typed out as it is spoken. The untyped rest is drawn invisible,
 * so the caption keeps its final size and words never jump to the next line.
 * Only this small component re-renders while typing; paused, it shows the whole line.
 */
function TypingCaption({
  line,
  playing,
  delay,
}: {
  line: string;
  playing: boolean;
  /** Wait before typing, matching the voice's wait for the slide to slide in. */
  delay: number;
}) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  const elapsed = useRef(0);

  useEffect(() => {
    elapsed.current = -delay;
    setShown(0);
  }, [line, delay]);

  useEffect(() => {
    if (!playing || reduceMotion) {
      return;
    }
    const total = speakingSeconds(line) * 1000 * TYPE_PACE;
    const id = setInterval(() => {
      elapsed.current += TYPE_TICK_MS;
      const next = Math.max(0, Math.min(line.length, Math.ceil((elapsed.current / total) * line.length)));
      setShown(next);
      if (next >= line.length) {
        clearInterval(id);
      }
    }, TYPE_TICK_MS);
    return () => clearInterval(id);
  }, [line, playing, reduceMotion]);

  const typed = !playing || reduceMotion ? line.length : shown;
  return (
    <AppText
      weight="semibold"
      size={14}
      leading={1.45}
      color={palette.textSoft}
      style={styles.flex}
      accessibilityLabel={line}
    >
      {line.slice(0, typed)}
      <Text style={styles.untyped}>{line.slice(typed)}</Text>
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: palette.background, overflow: 'hidden' },
  flex: { flex: 1 },
  body: { paddingHorizontal: 16, gap: 16 },
  chips: { flexDirection: 'row', gap: 6 },
  title: { letterSpacing: -0.3 },
  slide: { gap: 16 },
  untyped: { color: palette.untyped },
  tutor: {
    position: 'absolute',
    left: 0,
    // Just above the caption's top border (offsets count from inside the border).
    top: -TUTOR_MAX - 6,
    width: TUTOR_MAX,
    height: TUTOR_MAX,
  },
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
    left: VOICE_LEFT,
    right: VOICE_RIGHT,
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
