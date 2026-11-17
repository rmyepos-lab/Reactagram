/** Picks an item from a seed: the same seed always gives the same item (FNV-1a string hash). */
/* eslint-disable no-bitwise -- a string hash needs bit operations */
export function pickBySeed<T>(seed: string, items: readonly T[]): T {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return items[(h >>> 0) % items.length];
}
