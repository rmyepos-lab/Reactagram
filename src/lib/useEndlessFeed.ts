import { useCallback, useMemo, useState } from 'react';

export type Keyed<T> = { key: string; item: T };

/**
 * Endless feed over a finite list: when the user nears the end, another round of the
 * same items is added (in the order `nextRound` returns), so the feed never stops.
 */
export function useEndlessFeed<T extends { id: string }>(nextRound: () => T[]) {
  const [rounds, setRounds] = useState<T[][]>(() => [nextRound()]);

  const loadMore = useCallback(() => {
    setRounds(prev => [...prev, nextRound()]);
  }, [nextRound]);

  const items = useMemo<Keyed<T>[]>(
    () => rounds.flatMap((round, r) => round.map(item => ({ key: `${item.id}#${r}`, item }))),
    [rounds],
  );
  return { items, loadMore };
}
