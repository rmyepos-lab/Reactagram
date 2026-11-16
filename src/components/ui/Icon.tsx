import React from 'react';
import Svg, { Path } from 'react-native-svg';

/** 24×24 stroke icons. Add a path here to add an icon everywhere. */
const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  explore: 'M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
  learn: 'M8 5.5v13l11-6.5z',
  quiz: 'M9.2 9a3 3 0 1 1 4.3 2.7c-.9.5-1.5 1.2-1.5 2.3M12 17.5v.5M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  heart:
    'M12 20.5s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.6-7.5 10-7.5 10z',
  bookmark: 'M6 4h12v17l-6-4.5L6 21z',
  share: 'M4 12v7h16v-7M12 15V3M7.5 7.5 12 3l4.5 4.5',
  docs: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  volume: 'M4 9.5v5h4l5 4v-13l-5 4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  mute: 'M4 9.5v5h4l5 4v-13l-5 4zM17 9.5l5 5M22 9.5l-5 5',
  check: 'M5 12l5 5 9-10',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  down: 'M12 5v14M5 12l7 7 7-7',
  chevron: 'M9 5l7 7-7 7',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z',
  flame:
    'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-1.7.7-3 1.7-4 .2 1.6 1 2.4 1.8 2.4C11.5 9.5 10.5 6 12 3z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3.5 2',
  help: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.500A2.5 2.5 0 0 0 4 20.500zM4 20.500A2.5 2.5 0 0 0 6.5 23H20',
  mail: 'M3 6h18v12H3zM3 7l9 6.500L21 7',
  hide: 'M3 3l18 18M10.5 6.200A9.5 9.5 0 0 1 12 6c5.5 0 9 6 9 6a15 15 0 0 1-2.7 3.300M6.3 7.700A15 15 0 0 0 3 12s3.5 6 9 6a9 9 0 0 0 3.3-.6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.500v.5',
  key: 'M15 9a4 4 0 1 0-3.9 5H12l1.5 1.500H15V17h1.500v1.500H19V16l-4.3-4.300A4 4 0 0 0 15 9zM10 9h.01',
  play: 'M8 5.500v13l11-6.500z',
  pause: 'M8 5v14M16 5v14',
  trophy: 'M8 4h8v6a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 14v3M9 21v-1a3 3 0 0 1 6 0v1M7 21h10',
  thumbsUp: 'M7 11v9H4v-9zM7 11l4-7c1.2 0 2 .9 2 2v3h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7',
  retry: 'M4 12a8 8 0 1 0 2.3-5.7L4 8.5M4 3.5v5h5',
} as const;

export type IconName = keyof typeof PATHS;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Fill the shape with the stroke color (liked heart, saved bookmark). */
  filled?: boolean;
};

export const Icon = React.memo(function IconBase({
  name,
  size = 24,
  color = '#1C1B1F',
  strokeWidth = 2.2,
  filled = false,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d={PATHS[name]}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});
