import { Easing } from 'react-native-reanimated';

/** One place for every animation setting, so motion feels the same across the app. */
export const springs = {
  /** Small controls: buttons, chips, icons. */
  press: { damping: 18, stiffness: 420, mass: 0.6 },
  /** Things that pop: like heart, correct answer. */
  bouncy: { damping: 9, stiffness: 260, mass: 0.7 },
  /** Larger moves: tab pill, sheets, cards entering. */
  gentle: { damping: 20, stiffness: 210, mass: 0.9 },
} as const;

export const durations = { instant: 80, fast: 160, base: 240, slow: 420, hop: 300, idle: 1600 } as const;

export const easings = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  exit: Easing.bezier(0.3, 0, 1, 1),
  /** Endless back-and-forth moves (mascot bob, sparkle): no visible stop at either end. */
  loop: Easing.inOut(Easing.sin),
  /** A hop: fast start going up, speeding up coming down. */
  rise: Easing.out(Easing.quad),
  fall: Easing.in(Easing.quad),
} as const;
