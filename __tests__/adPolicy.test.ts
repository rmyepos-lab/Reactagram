import { AD_RULES, earnsSmartSkip, interleaveAds } from '../src/features/ads/policy';

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

describe('Smart Skip', () => {
  it('skips the ad with at least 5 right out of 6', () => {
    expect(earnsSmartSkip([true, true, true, true, true, false])).toBe(true);
    expect(earnsSmartSkip([true, true, true, true, true, true])).toBe(true);
  });

  it('shows the ad with 4 right, or with unanswered quizzes', () => {
    expect(earnsSmartSkip([true, true, true, true, false, false])).toBe(false);
    expect(earnsSmartSkip([true, true, true, true, undefined, undefined])).toBe(false);
  });
});
