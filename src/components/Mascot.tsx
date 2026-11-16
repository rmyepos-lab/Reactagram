import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { colors, durations, easings, reel, springs } from '../theme';

/**
 * idle: calm, for Home. The other three are for quiz results:
 * cheer (great score), steady (fair score), low (weak score, still kind).
 */
export type MascotMood = 'idle' | 'cheer' | 'steady' | 'low';

// The waving arm turns around its shoulder, at the laptop corner (47, 44 in the 64 box).
const SHOULDER = { transformOrigin: '73.4% 68.75%' } as const;

/** Per mood: how far the fox moves up (negative) or sinks (positive), how much it sways, and its head lean. */
const MOVE: Record<MascotMood, { lift: number; sway: number; lean: number }> = {
  idle: { lift: -3, sway: 3, lean: -6 },
  cheer: { lift: -9, sway: 0, lean: 0 },
  steady: { lift: -3, sway: 5, lean: 0 },
  low: { lift: 2, sway: 3, lean: 0 },
};

const ink = { fill: 'none', stroke: colors.ink, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Hookd's mascot: a small fox in round glasses, coding behind a laptop. */
export function Mascot({ size = 64, mood = 'idle' }: { size?: number; mood?: MascotMood }) {
  const lift = useSharedValue(0);
  const sway = useSharedValue(0.5);
  const twinkle = useSharedValue(0);
  const pop = useSharedValue(mood === 'idle' ? 1 : 0.6);
  // Home: the fox slides in from the left, then waves now and then.
  const slide = useSharedValue(mood === 'idle' ? 0 : 1);
  const wave = useSharedValue(0);

  useEffect(() => {
    pop.value = withSpring(1, springs.bouncy);
    if (mood === 'cheer') {
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
      const slow = mood === 'low' ? 1.5 : 1;
      lift.value = withRepeat(withTiming(1, { duration: durations.idle * slow, easing: easings.loop }), -1, true);
      sway.value = withRepeat(
        withTiming(1, { duration: durations.idle * slow * 1.3, easing: easings.loop }),
        -1,
        true,
      );
      if (mood === 'idle') {
        slide.value = withDelay(durations.base, withSpring(1, springs.gentle));
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
  }, [mood, lift, sway, twinkle, pop, slide, wave]);

  const move = MOVE[mood];
  const body = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, slide.value)),
    transform: [
      { translateX: (slide.value - 1) * size * 0.7 },
      { translateY: lift.value * move.lift },
      { rotate: `${move.lean + (sway.value - 0.5) * move.sway}deg` },
      { scale: pop.value },
    ],
  }));
  const arm = useAnimatedStyle(() => ({ transform: [{ rotate: `${-6 + wave.value * 24}deg` }] }));
  const sparkle = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * twinkle.value,
    transform: [{ scale: 0.85 + 0.2 * twinkle.value }],
  }));

  const low = mood === 'low';
  const cheer = mood === 'cheer';
  const idle = mood === 'idle';

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
          <Path
            d={low ? 'M30 42.2q2-1.6 4 0' : cheer ? 'M29 40.2q3 3 6 0' : 'M30 40.5q2 1.8 4 0'}
            {...ink}
            strokeWidth={1.3}
          />
          {/* laptop: code, a check, or "thinking" dots */}
          <Rect x={15} y={43} width={34} height={16} rx={3} fill={reel.code} />
          {cheer ? (
            <Path d="M26 51l4 4 8-8" {...ink} stroke={reel.syntax.string} strokeWidth={2.2} />
          ) : low ? (
            <>
              <Circle cx={26} cy={51} r={1.5} fill={reel.muted} />
              <Circle cx={32} cy={51} r={1.5} fill={reel.muted} />
              <Circle cx={38} cy={51} r={1.5} fill={reel.muted} />
            </>
          ) : (
            <Path d="M27 48l-3 3 3 3M37 48l3 3-3 3M33.5 47.5l-3 7.5" {...ink} stroke={reel.accent} strokeWidth={1.8} />
          )}
          <Rect x={9} y={58} width={46} height={4} rx={2} fill={colors.primaryLedge} />
          {/* paws */}
          <Ellipse cx={20} cy={43.5} rx={4} ry={2.6} fill={colors.streak} />
          {idle ? null : <Ellipse cx={44} cy={43.5} rx={4} ry={2.6} fill={colors.streak} />}
        </Svg>
        {idle ? (
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
