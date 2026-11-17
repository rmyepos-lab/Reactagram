import { useCallback, useMemo, useState } from 'react';

export type Keyed<T> = { key: string; item: T };

/**
 * Endless feed over a finite list: when the user nears the end, another round of the
 * same items is added (in the order `nextRound` returns), so the feed never stops.
 * `nextRound` gets the round number (0 = first) and the ids already in the feed. It must not
 * have side effects.
 */
export function useEndlessFeed<T extends { id: string }>(
  nextRound: (round: number, shown: ReadonlySet<string>) => T[],
) {
  const [rounds, setRounds] = useState<T[][]>(() => [nextRound(0, new Set())]);

  const loadMore = useCallback(() => {
    setRounds(prev => [...prev, nextRound(prev.length, new Set(prev.flat().map(item => item.id)))]);
  }, [nextRound]);

  const items = useMemo<Keyed<T>[]>(
    () => rounds.flatMap((round, r) => round.map(item => ({ key: `${item.id}#${r}`, item }))),
    [rounds],
  );
  return { items, loadMore };
}
