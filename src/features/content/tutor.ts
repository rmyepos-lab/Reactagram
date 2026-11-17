import type { LearnSlide } from './schema';

/** Largest fox, in dp: the size it is drawn at; smaller sizes scale down from it. */
export const TUTOR_MAX = 240;
/** Smallest fox, tucked at the right when the slide leaves little room. */
export const TUTOR_MIN = 72;
/** Below this much free height the fox steps aside instead of standing in the middle. */
const CENTER_FROM = 120;
/** Space kept between the slide's content and the fox's ears. */
const HEADROOM = 16;

/** What the fox tutor does, where it stands above the caption, and how big it is. */
export type TutorPose = {
  mood: 'idle' | 'talk' | 'cheer';
  spot: 'center' | 'right';
  size: number;
};

/**
 * `room` is the free height between the slide's content and the caption, in dp.
 * Emptier slides get a bigger fox; full slides keep it small and out of the way.
 */
export function tutorPose(slide: Pick<LearnSlide, 'type'>, finished: boolean, room: number): TutorPose {
  const mood = finished ? 'cheer' : slide.type === 'title' ? 'idle' : 'talk';
  const fit = Math.min(TUTOR_MAX, room - HEADROOM);
  return fit >= CENTER_FROM
    ? { mood, spot: 'center', size: fit }
    : { mood, spot: 'right', size: TUTOR_MIN };
}

/** Left offset of the fox's `box` (scaled around its center to `pose.size`) in a row `row` wide. */
export function tutorX(pose: TutorPose, row: number, box: number): number {
  return pose.spot === 'center' ? (row - box) / 2 : row - (box + pose.size) / 2;
}
