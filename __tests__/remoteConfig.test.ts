import { changedRows, DEFAULT_CONFIG, mergeConfig } from '../src/features/remoteConfig/schema';

describe('remote config', () => {
  it('starts with ads on and Pro activation off (coming soon)', () => {
    expect(DEFAULT_CONFIG.adsEnabled).toBe(true);
    expect(DEFAULT_CONFIG.proActivationEnabled).toBe(false);
  });

  it('applies server rows over the defaults', () => {
    const next = mergeConfig(DEFAULT_CONFIG, [
      { key: 'adsEnabled', value: false },
      { key: 'contactEmail', value: 'help@example.com' },
    ]);
    expect(next.adsEnabled).toBe(false);
    expect(next.contactEmail).toBe('help@example.com');
    expect(next.proActivationEnabled).toBe(false);
  });

  it('ignores unknown keys and values of the wrong type', () => {
    const next = mergeConfig(DEFAULT_CONFIG, [
      { key: 'adsEnabled', value: 'no' },
      { key: 'helpUrl', value: 42 },
      { key: 'somethingElse', value: true },
    ]);
    expect(next).toEqual(DEFAULT_CONFIG);
  });

  it('saves only what changed, with text trimmed', () => {
    const after = { ...DEFAULT_CONFIG, adsEnabled: false, helpUrl: ' https://example.com ' };
    expect(changedRows(DEFAULT_CONFIG, after)).toEqual([
      { key: 'adsEnabled', value: false },
      { key: 'helpUrl', value: 'https://example.com' },
    ]);
  });
});
