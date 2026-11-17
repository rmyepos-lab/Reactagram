import { pickBySeed } from '../src/lib/seed';

describe('pickBySeed', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

  it('gives the same item for the same seed', () => {
    expect(pickBySeed('what-is-a-component', items)).toBe(pickBySeed('what-is-a-component', items));
  });

  it('spreads many seeds over every item', () => {
    const seen = new Set(Array.from({ length: 200 }, (_, i) => pickBySeed(`reel-${i}`, items)));
    expect(seen.size).toBe(items.length);
  });
});
