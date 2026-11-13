import { useEffect } from 'react';
import { progress } from './store';

const TICK_SECONDS = 5;

/** Counts time spent watching reels toward today's goal while `active` is true. */
export function useReelTimer(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }
    const id = setInterval(() => progress.addSeconds(TICK_SECONDS), TICK_SECONDS * 1000);
    return () => clearInterval(id);
  }, [active]);
}
