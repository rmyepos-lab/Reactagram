import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors, topicPalette } from '../theme';

type Draw = (c: string, a: string) => React.ReactNode;

const line = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const jsx: Draw = (c, a) => (
  <>
    <Path d="M8 7l-5 5 5 5M16 7l5 5-5 5" stroke={c} {...line} />
    <Path d="M13.5 5l-3 14" stroke={a} {...line} />
  </>
);

const hook = (x: number, c: string) => (
  <>
    <Circle cx={x} cy={4} r={1.8} stroke={c} {...line} />
    <Path d={`M${x} 5.8V15a4.5 4.5 0 0 1-9 0v-1.5l2.2 1.6`} stroke={c} {...line} />
  </>
);

/** One small drawing per curriculum topic: c is the main stroke, a the accent. */
const ART: Record<string, Draw> = {
  'Components & JSX': jsx,
  Props: (c, a) => (
    <>
      <Rect x={4} y={3} width={16} height={6} rx={2} stroke={c} {...line} />
      <Rect x={8} y={15} width={8} height={6} rx={2} stroke={c} {...line} />
      <Path d="M12 9v4.5M10 11.5l2 2 2-2" stroke={a} {...line} />
    </>
  ),
  'Rendering Lists & Conditions': (c, a) => (
    <>
      <Circle cx={5} cy={6} r={1.6} fill={a} />
      <Circle cx={5} cy={12} r={1.6} fill={a} />
      <Circle cx={5} cy={18} r={1.6} fill={a} />
      <Path d="M9 6h11M9 12h11M9 18h7" stroke={c} {...line} />
    </>
  ),
  Purity: (c, a) => (
    <>
      <Path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" stroke={c} {...line} />
      <Path d="M9.5 14.5A2.5 2.5 0 0 0 12 17" stroke={a} {...line} />
    </>
  ),
  Events: (c, a) => (
    <>
      <Path d="M9 6v14l3.6-3.2 2.4 5.2 2.2-1-2.4-5.2H20z" stroke={c} {...line} />
      <Path d="M5.5 6H3M6.5 2.5 5 1M10 2.5V1" stroke={a} {...line} />
    </>
  ),
  State: (c, a) => (
    <>
      <Rect x={2} y={7} width={20} height={10} rx={5} stroke={c} {...line} />
      <Circle cx={17} cy={12} r={3} fill={a} />
    </>
  ),
  'State Structure & Sharing': (c, a) => (
    <>
      <Path d="M12 7.5v4M5 16.5v-3h14v3" stroke={c} {...line} />
      <Circle cx={12} cy={5} r={2.5} fill={a} />
      <Circle cx={5} cy={19} r={2.5} stroke={c} {...line} />
      <Circle cx={19} cy={19} r={2.5} stroke={c} {...line} />
    </>
  ),
  Reducers: (c, a) => (
    <>
      <Path d="M3 4h18l-7 8v6l-4 2v-8z" stroke={c} {...line} />
      <Path d="M7.5 8h9" stroke={a} {...line} />
    </>
  ),
  Context: (c, a) => (
    <>
      <Path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9.5 9.5 0 0 0 0 13M18.5 5.5a9.5 9.5 0 0 1 0 13" stroke={c} {...line} />
      <Circle cx={12} cy={12} r={2.2} fill={a} />
    </>
  ),
  Hooks: (c, a) => (
    <>
      {hook(14, c)}
      <Path d="M17.5 11l3.5 2-3.5 2z" fill={a} />
    </>
  ),
  Refs: (c, a) => (
    <>
      <Circle cx={12} cy={12} r={7.5} stroke={c} {...line} />
      <Path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" stroke={c} {...line} />
      <Circle cx={12} cy={12} r={2.8} fill={a} />
    </>
  ),
  'Side Effects': (c, a) => <Path d="M13 2 4 14h7l-1 8 9-12h-7z" stroke={c} {...line} fill={a} />,
  'Custom Hooks': (c, a) => (
    <>
      {hook(11, c)}
      <Path d="M18 8v8M14 12h8" stroke={a} {...line} />
    </>
  ),
  Performance: (c, a) => (
    <>
      <Path d="M3 17a9 9 0 0 1 18 0" stroke={c} {...line} />
      <Path d="M12 17l5-6" stroke={a} {...line} />
      <Circle cx={12} cy={17} r={1.8} fill={c} />
    </>
  ),
  'Concurrent Rendering': (c, a) => (
    <>
      <Path d="M3 8h14M14 5l3 3-3 3" stroke={c} {...line} />
      <Path d="M7 16h14M18 13l3 3-3 3" stroke={a} {...line} />
    </>
  ),
  'Suspense & Data': (c, a) => (
    <>
      <Path d="M6 3h12M6 21h12M7 3v3l5 6-5 6v3M17 3v3l-5 6 5 6v3" stroke={c} {...line} />
      <Path d="M9.5 19.5h5L12 16.5z" fill={a} />
    </>
  ),
  'Actions & Forms': (c, a) => (
    <>
      <Rect x={3} y={3} width={18} height={18} rx={2.5} stroke={c} {...line} />
      <Path d="M7 8h10M7 12h6" stroke={c} {...line} />
      <Path d="M11 16.5l2 2 4-4" stroke={a} {...line} />
    </>
  ),
  'Errors & Escape Hatches': (c, a) => (
    <>
      <Path d="M12 3 2 20h20z" stroke={c} {...line} />
      <Path d="M12 9.5v4.5" stroke={a} {...line} />
      <Circle cx={12} cy={17} r={1.1} fill={a} />
    </>
  ),
  'Server Components': (c, a) => (
    <>
      <Rect x={3} y={3} width={18} height={7} rx={2} stroke={c} {...line} />
      <Rect x={3} y={14} width={18} height={7} rx={2} stroke={c} {...line} />
      <Path d="M11 6.5h6M11 17.5h6" stroke={c} {...line} />
      <Circle cx={7} cy={6.5} r={1.2} fill={a} />
      <Circle cx={7} cy={17.5} r={1.2} fill={a} />
    </>
  ),
  'How React Works': (c, a) => (
    <>
      <Ellipse cx={12} cy={12} rx={10} ry={4} stroke={c} {...line} />
      <Ellipse cx={12} cy={12} rx={10} ry={4} rotation={60} origin={[12, 12]} stroke={c} {...line} />
      <Ellipse cx={12} cy={12} rx={10} ry={4} rotation={-60} origin={[12, 12]} stroke={c} {...line} />
      <Circle cx={12} cy={12} r={2} fill={a} />
    </>
  ),
};

const TOPIC_NAMES = Object.keys(ART);

/** The topic's own colors, stable by its place in the curriculum. */
export function topicColors(topic: string) {
  const i = TOPIC_NAMES.indexOf(topic);
  return topicPalette[(i < 0 ? 0 : i) % topicPalette.length];
}

/** Illustration for a topic; unknown topics get the JSX brackets. */
export function TopicArt({
  topic,
  size = 28,
  color = colors.onPrimaryContainer,
  accent = colors.primary,
}: {
  topic: string;
  size?: number;
  color?: string;
  accent?: string;
}) {
  const draw = ART[topic] ?? jsx;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {draw(color, accent)}
    </Svg>
  );
}
