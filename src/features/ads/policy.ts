/** Ad rules. Pure functions, so they are easy to test and to change in one place. */
export const AD_RULES = {
  /** Home: 1 sponsored post after every 6 posts. */
  homeEvery: 6,
  /** Learn: 1 sponsored reel after every 7 reels. */
  learnEvery: 7,
  /** Quiz: an ad slot after every 6 quizzes... */
  quizBlock: 6,
  /** ...skipped when at least 5 of those 6 were right (Smart Skip). */
  quizSkipAt: 5,
} as const;

export type AdSlot = { kind: 'ad'; id: string };
export type FeedItem<T> = { kind: 'content'; id: string; item: T } | AdSlot;

/**
 * Puts an ad slot after every `every` content items.
 * `keep` lets the caller drop single slots (hidden, failed to load, or earned by Smart Skip).
 */
export function interleaveAds<T>(
  items: readonly { key: string; item: T }[],
  every: number,
  adsEnabled: boolean,
  keep: (slotIndex: number, slotId: string) => boolean = () => true,
): FeedItem<T>[] {
  const out: FeedItem<T>[] = [];
  items.forEach(({ key, item }, i) => {
    out.push({ kind: 'content', id: key, item });
    const blockDone = (i + 1) % every === 0;
    if (adsEnabled && blockDone) {
      const slotIndex = (i + 1) / every - 1;
      const id = `ad-${slotIndex}`;
      if (keep(slotIndex, id)) {
        out.push({ kind: 'ad', id });
      }
    }
  });
  return out;
}

/** Smart Skip: true when the block's results earn skipping the ad that follows it. */
export function earnsSmartSkip(blockResults: readonly (boolean | undefined)[]): boolean {
  return blockResults.filter(r => r === true).length >= AD_RULES.quizSkipAt;
}
