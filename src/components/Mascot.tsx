import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { dayKey } from '../lib/date';
import { pickBySeed } from '../lib/seed';
import { colors, durations, easings, reel, springs } from '../theme';

/**
 * idle: calm and waving, for Home and the first slide of a Learn reel.
 * talk: the Learn reel tutor, bobbing and pointing at the lesson.
 * cheer (great score or reel done), steady (fair score), low (weak score, still kind).
 */
export type MascotMood = 'idle' | 'talk' | 'cheer' | 'steady' | 'low';

// The waving arm turns around its shoulder, at the laptop corner (47, 44 in the 64 box).
const SHOULDER = { transformOrigin: '73.4% 68.75%' } as const;

/** Per mood: how far the fox moves up (negative) or sinks (positive), how much it sways, and its head lean. */
const MOVE: Record<MascotMood, { lift: number; sway: number; lean: number }> = {
  idle: { lift: -3, sway: 3, lean: -6 },
  talk: { lift: -2, sway: 4, lean: -4 },
  cheer: { lift: -9, sway: 0, lean: 0 },
  steady: { lift: -3, sway: 5, lean: 0 },
  low: { lift: 2, sway: 3, lean: 0 },
};

const ink = { fill: 'none', stroke: colors.ink, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** What is drawn on the laptop lid. The fox gets one per seed, so it varies but never flickers. */
const LOOKS = ['plain', 'glow', 'paw', 'atom', 'lines', 'heart', 'spark', 'light'] as const;
type MascotLook = (typeof LOOKS)[number];

function LidArt({ look }: { look: MascotLook }) {
  switch (look) {
    case 'plain':
      return <Path d="M18 46h6" stroke={reel.border} strokeWidth={1.6} strokeLinecap="round" />;
    case 'glow':
      return (
        <>
          <Circle cx={32} cy={51} r={4.6} fill={reel.accent} opacity={0.18} />
          <Circle cx={32} cy={51} r={2.6} fill={reel.accent} />
        </>
      );
    case 'paw':
      return (
        <G fill={colors.streak}>
          <Ellipse cx={32} cy={53} rx={3.4} ry={2.8} />
          <Circle cx={27.6} cy={49.4} r={1.3} />
          <Circle cx={30.4} cy={47.6} r={1.3} />
          <Circle cx={33.6} cy={47.6} r={1.3} />
          <Circle cx={36.4} cy={49.4} r={1.3} />
        </G>
      );
    case 'atom':
      return (
        <>
          <G fill="none" stroke={reel.accent} strokeWidth={1.1}>
            <Ellipse cx={32} cy={51} rx={6.5} ry={2.4} />
            <Ellipse cx={32} cy={51} rx={6.5} ry={2.4} transform="rotate(60 32 51)" />
            <Ellipse cx={32} cy={51} rx={6.5} ry={2.4} transform="rotate(-60 32 51)" />
          </G>
          <Circle cx={32} cy={51} r={1.3} fill={reel.accent} />
        </>
      );
    case 'lines':
      return (
        <G strokeLinecap="round" strokeWidth={1.6}>
          <Path d="M20 47.5h7" stroke={reel.syntax.keyword} />
          <Path d="M29 47.5h9" stroke={reel.syntax.function} />
          <Path d="M23 51.5h11" stroke={reel.syntax.string} />
          <Path d="M36 51.5h5" stroke={reel.syntax.number} />
          <Path d="M20 55.5h6" stroke={reel.syntax.keyword} />
        </G>
      );
    case 'heart':
      return (
        <Path
          d="M32 55.2c-3.6-2.4-5.6-4.3-5.6-6.4 0-1.6 1.2-2.7 2.6-2.7 1.2 0 2.2.7 3 1.7.8-1 1.8-1.7 3-1.7 1.4 0 2.6 1.1 2.6 2.7 0 2.1-2 4-5.6 6.4z"
          fill={reel.liked}
        />
      );
    case 'spark':
      return <Path d="M32 45.5l1.3 4.2 4.2 1.3-4.2 1.3-1.3 4.2-1.3-4.2-4.2-1.3 4.2-1.3z" fill={reel.syntax.number} />;
    case 'light':
      return <Circle cx={32} cy={51} r={2.4} fill={colors.streak} />;
  }
}

/** Hookd's mascot: a small fox in round glasses, coding behind a laptop. */
export function Mascot({
  size = 64,
  mood = 'idle',
  moving = true,
  wave: waves = true,
  seed,
}: {
  size?: number;
  mood?: MascotMood;
  /** Picks the laptop look, e.g. the reel id. Without one, the look changes once a day. */
  seed?: string;
  /** False keeps both paws on the laptop: no raised, waving arm. */
  wave?: boolean;
  /** False holds the fox still (paused reel); its loops stop, so it costs nothing per frame. */
  moving?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);
  const sway = useSharedValue(0.5);
  const twinkle = useSharedValue(0);
  const pop = useSharedValue(mood === 'idle' ? 1 : 0.6);
  // Home: the fox slides in from the left, then waves now and then.
  const slide = useSharedValue(mood === 'idle' ? 0 : 1);
  const wave = useSharedValue(0);

  useEffect(() => {
    const loop = (duration: number) =>
      withRepeat(withTiming(1, { duration, easing: easings.loop }), -1, true);
    if (reduceMotion) {
      pop.value = 1;
      slide.value = 1;
      lift.value = 0;
      sway.value = 0.5;
      wave.value = 0;
      twinkle.value = 1;
    } else if (!moving) {
      // Settle into the rest pose instead of freezing mid-bob.
      pop.value = withSpring(1, springs.bouncy);
      slide.value = withSpring(1, springs.gentle);
      lift.value = withTiming(0, { duration: durations.base });
      sway.value = withTiming(0.5, { duration: durations.base });
      wave.value = withTiming(0, { duration: durations.base });
    } else if (mood === 'talk') {
      pop.value = withSpring(1, springs.bouncy);
      slide.value = 1;
      // A quick nod, as if speaking, and a slow pointing gesture.
      lift.value = loop(durations.idle / 4);
      sway.value = loop(durations.idle * 1.3);
      if (waves) {
        wave.value = loop(durations.idle / 2);
      }
    } else if (mood === 'cheer') {
      pop.value = withSpring(1, springs.bouncy);
      // A hop, a short rest, and again.
      lift.value = withDelay(
        durations.slow,
        withRepeat(
          withSequence(
            withTiming(1, { duration: durations.hop, easing: easings.rise }),
            withTiming(0, { duration: durations.hop, easing: easings.fall }),
            withTiming(0, { duration: durations.idle / 2 }),
          ),
          -1,
        ),
      );
      twinkle.value = withRepeat(withTiming(1, { duration: durations.idle / 2, easing: easings.loop }), -1, true);
    } else {
      pop.value = withSpring(1, springs.bouncy);
      const slow = mood === 'low' ? 1.5 : 1;
      lift.value = withRepeat(withTiming(1, { duration: durations.idle * slow, easing: easings.loop }), -1, true);
      sway.value = withRepeat(
        withTiming(1, { duration: durations.idle * slow * 1.3, easing: easings.loop }),
        -1,
        true,
      );
      if (mood === 'idle') {
        slide.value = withDelay(durations.base, withSpring(1, springs.gentle));
      }
      if (mood === 'idle' && waves) {
        const swing = (to: number) => withTiming(to, { duration: durations.hop, easing: easings.loop });
        wave.value = withDelay(
          durations.slow * 2,
          withRepeat(
            withSequence(swing(1), swing(0), swing(1), swing(0), withTiming(0, { duration: durations.idle * 1.5 })),
            -1,
          ),
        );
      }
    }
    return () => {
      cancelAnimation(lift);
      cancelAnimation(sway);
      cancelAnimation(twinkle);
      cancelAnimation(wave);
    };
  }, [mood, moving, waves, reduceMotion, lift, sway, twinkle, pop, slide, wave]);

  const move = MOVE[mood];
  const talk = mood === 'talk';
  // Waving swings the arm wide; talking holds it out to the side with a small gesture.
  const armRest = talk ? 18 : -6;
  const armSwing = talk ? 10 : 24;
  const body = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, slide.value)),
    transform: [
      { translateX: (slide.value - 1) * size * 0.7 },
      { translateY: lift.value * move.lift },
      { rotate: `${move.lean + (sway.value - 0.5) * move.sway}deg` },
      { scale: pop.value },
    ],
  }));
  const arm = useAnimatedStyle(() => ({ transform: [{ rotate: `${armRest + wave.value * armSwing}deg` }] }));
  const sparkle = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * twinkle.value,
    transform: [{ scale: 0.85 + 0.2 * twinkle.value }],
  }));

  const low = mood === 'low';
  const cheer = mood === 'cheer';
  const armUp = waves && (mood === 'idle' || talk);
  // Cheer and low keep their own screen (a check, thinking dots) on the dark lid.
  const look = pickBySeed(seed ?? dayKey(), LOOKS);
  const lid = look === 'light' && !cheer && !low ? colors.primaryContainer : reel.code;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, body]}>
        <Svg width={size} height={size} viewBox="0 0 64 64">
          {/* ears: up, or drooping to the sides when low */}
          {low ? (
            <>
              <Path d="M12 29 3 15 23 17Z" fill={colors.streak} />
              <Path d="M52 29 61 15 41 17Z" fill={colors.streak} />
              <Path d="M12 24 7.5 17 18 18.5Z" fill={colors.streakContainer} />
              <Path d="M52 24 56.5 17 46 18.5Z" fill={colors.streakContainer} />
            </>
          ) : (
            <>
              <Path d="M12 26 14 5 29 17Z" fill={colors.streak} />
              <Path d="M52 26 50 5 35 17Z" fill={colors.streak} />
              <Path d="M16 21 17 11 25 17Z" fill={colors.streakContainer} />
              <Path d="M48 21 47 11 39 17Z" fill={colors.streakContainer} />
            </>
          )}
          {/* head and muzzle */}
          <Path d="M11 27Q11 13 32 13Q53 13 53 27Q53 39 32 49Q11 39 11 27Z" fill={colors.streak} />
          <Path d="M19 34Q26 31 32 35Q38 31 45 34Q41 44 32 49Q23 44 19 34Z" fill={colors.white} />
          {low ? <Path d="M19 20.5 26.5 18M45 20.5 37.5 18" {...ink} strokeWidth={1.8} /> : null}
          {/* glasses */}
          <Line x1={29} y1={27} x2={35} y2={27} stroke={colors.primary} strokeWidth={2} />
          <Circle cx={24.5} cy={27} r={5} fill={colors.white} stroke={colors.primary} strokeWidth={2} />
          <Circle cx={39.5} cy={27} r={5} fill={colors.white} stroke={colors.primary} strokeWidth={2} />
          {/* eyes: happy arcs, looking down, or looking ahead */}
          {cheer ? (
            <Path d="M22 28.5q2.5-3.5 5 0M37 28.5q2.5-3.5 5 0" {...ink} strokeWidth={1.8} />
          ) : (
            <>
              <Circle cx={low ? 24.5 : 25.5} cy={low ? 29 : 27.5} r={2} fill={colors.ink} />
              <Circle cx={low ? 39.5 : 40.5} cy={low ? 29 : 27.5} r={2} fill={colors.ink} />
            </>
          )}
          {/* nose and mouth */}
          <Ellipse cx={32} cy={38} rx={2.6} ry={1.8} fill={colors.ink} />
          {talk ? (
            <Ellipse cx={32} cy={42} rx={2} ry={1.5} fill={colors.ink} />
          ) : (
            <Path
              d={low ? 'M30 42.2q2-1.6 4 0' : cheer ? 'M29 40.2q3 3 6 0' : 'M30 40.5q2 1.8 4 0'}
              {...ink}
              strokeWidth={1.3}
            />
          )}
          {/* laptop: its look, a check, or "thinking" dots */}
          <Rect x={15} y={43} width={34} height={16} rx={3} fill={lid} />
          {cheer ? (
            <Path d="M26 51l4 4 8-8" {...ink} stroke={reel.syntax.string} strokeWidth={2.2} />
          ) : low ? (
            <>
              <Circle cx={26} cy={51} r={1.5} fill={reel.muted} />
              <Circle cx={32} cy={51} r={1.5} fill={reel.muted} />
              <Circle cx={38} cy={51} r={1.5} fill={reel.muted} />
            </>
          ) : (
            <LidArt look={look} />
          )}
          <Rect x={9} y={58} width={46} height={4} rx={2} fill={colors.primaryLedge} />
          {/* paws */}
          <Ellipse cx={20} cy={43.5} rx={4} ry={2.6} fill={colors.streak} />
          {armUp ? null : <Ellipse cx={44} cy={43.5} rx={4} ry={2.6} fill={colors.streak} />}
        </Svg>
        {armUp ? (
          <Animated.View style={[StyleSheet.absoluteFill, SHOULDER, arm]}>
            <Svg width={size} height={size} viewBox="0 0 64 64">
              <Path d="M47 44 54.5 32" fill="none" stroke={colors.streak} strokeWidth={5.5} strokeLinecap="round" />
              <Circle cx={55} cy={30} r={4.2} fill={colors.streak} />
              <Circle cx={55} cy={30} r={1.7} fill={colors.streakContainer} />
            </Svg>
          </Animated.View>
        ) : null}
      </Animated.View>

      {cheer ? (
        <Animated.View style={[StyleSheet.absoluteFill, sparkle]}>
          <Svg width={size} height={size} viewBox="0 0 64 64">
            <Path d="M6 4l1.4 3.6L11 9l-3.6 1.4L6 14l-1.4-3.6L1 9l3.6-1.4z" fill={colors.primary} />
            <Path d="M58 1l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill={colors.pro} />
            <Path d="M59.5 30l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill={colors.streak} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}
