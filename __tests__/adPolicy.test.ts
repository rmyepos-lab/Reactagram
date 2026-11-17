import { AD_RULES, interleaveAds } from '../src/features/ads/policy';

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ key: `r${i}`, item: i }));
const kinds = (feed: { kind: string }[]) => feed.map(f => (f.kind === 'ad' ? 'AD' : 'r')).join('');

describe('interleaveAds', () => {
  it('puts one sponsored reel after every 7 learn reels', () => {
    expect(kinds(interleaveAds(items(15), AD_RULES.learnEvery, true))).toBe('rrrrrrrADrrrrrrrADr');
  });

  it('puts one sponsored post after every 6 home posts', () => {
    expect(kinds(interleaveAds(items(7), AD_RULES.homeEvery, true))).toBe('rrrrrrADr');
  });

  it('adds nothing when ads are off (Pro, or no SDK key)', () => {
    expect(kinds(interleaveAds(items(15), AD_RULES.learnEvery, false))).toBe('r'.repeat(15));
  });

  it('lets the caller drop single slots', () => {
    const feed = interleaveAds(items(14), 7, true, (_, id) => id !== 'ad-0');
    expect(feed.filter(f => f.kind === 'ad').map(f => f.id)).toEqual(['ad-1']);
  });
});
