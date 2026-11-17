/** Design tokens from board 7 (Material 3 Expressive). Never hard-code colors in components. */
export const colors = {
  surface: '#FBF9F6',
  container: '#F2EFEA',
  containerHigh: '#EAE6DF',
  card: '#FFFFFF',
  border: '#E6E1D9',
  outline: '#8D877E',
  text: '#1C1B1F',
  textVariant: '#4A4740',
  textMuted: '#5F5B54',
  primary: '#087EA4',
  primaryLedge: '#05607E',
  primaryContainer: '#CDEBF5',
  primaryTint: '#EAF5F9',
  primaryTrack: '#CDE3EA',
  onPrimaryContainer: '#00374A',
  pro: '#6B4FA0',
  proLedge: '#4A3478',
  proContainer: '#E9DDFF',
  proTint: '#EFE7FB',
  proOutline: '#CDBDF0',
  onProContainer: '#3A2668',
  correct: '#2F7D32',
  correctContainer: '#D8EFD5',
  onCorrectContainer: '#0F3D12',
  wrong: '#B3261E',
  wrongContainer: '#FCE4E2',
  onWrongContainer: '#5C0F0A',
  streak: '#C2541B',
  streakContainer: '#FFE3D1',
  onStreakContainer: '#8A3410',
  tip: '#F6E7C1',
  onTip: '#3D2E00',
  ink: '#1C1B1F',
  inkLedge: '#000000',
  white: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.5)',
} as const;

/** Dark palette used by reels. */
export const reel = {
  background: '#17191C',
  divider: '#0E0F11',
  chip: '#2A2D31',
  chipText: '#C9CED6',
  topicChip: '#1F4E5F',
  code: '#22252A',
  codeAlt: '#1E2124',
  codeHighlight: 'rgba(136,192,208,0.14)',
  text: '#ECEFF4',
  textSoft: '#DDE1E7',
  /** Caption letters not typed yet. Not 'transparent': Android reads a zero color as "inherit". */
  untyped: 'rgba(23,25,28,0.01)',
  muted: '#A9B0BA',
  dim: '#8A929E',
  accent: '#5DB4D2',
  border: '#33373D',
  liked: '#F2B8B5',
  likedContainer: '#3B2328',
  syntax: {
    keyword: '#D08770',
    function: '#88C0D0',
    number: '#EBCB8B',
    string: '#A3BE8C',
    comment: '#8A929E',
  },
} as const;

/** One color set per topic circle: soft fill, dark drawing, strong accent and ring. */
export const topicPalette = [
  { fill: '#CDEBF5', ink: '#00374A', accent: '#087EA4' }, // blue
  { fill: '#E9DDFF', ink: '#3A2668', accent: '#6B4FA0' }, // purple
  { fill: '#FFE3D1', ink: '#8A3410', accent: '#C2541B' }, // orange
  { fill: '#D8EFD5', ink: '#0F3D12', accent: '#2F7D32' }, // green
  { fill: '#FADCE8', ink: '#5C1233', accent: '#B4386B' }, // pink
  { fill: '#F6E7C1', ink: '#3D2E00', accent: '#9A6A00' }, // yellow
  { fill: '#CFF0EA', ink: '#003D35', accent: '#0F7F70' }, // teal
  { fill: '#FCE4E2', ink: '#5C0F0A', accent: '#B3261E' }, // red
] as const;

export const radii = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, full: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

/** Android resolves fonts by file name (android/app/src/main/assets/fonts). */
export const fonts = {
  semibold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extrabold: 'Nunito-ExtraBold',
  black: 'Nunito-Black',
  mono: 'JetBrainsMono-Medium',
  monoBold: 'JetBrainsMono-SemiBold',
} as const;

export const layout = { tabBarHeight: 80, ledge: 4, minTouch: 48 } as const;
