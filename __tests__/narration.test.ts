import { fingerprint, narrationPath, narrationUrl } from '../src/features/narration/logic';

describe('narration files', () => {
  it('gives the same text the same file, and another text another file', () => {
    expect(narrationPath('Hello hooks.')).toBe(narrationPath('Hello hooks.'));
    expect(narrationPath('Hello hooks.')).not.toBe(narrationPath('Hello hooks!'));
  });

  it('ignores spaces around the text', () => {
    expect(narrationPath('  Hello hooks. ')).toBe(narrationPath('Hello hooks.'));
  });

  it('names files with 16 safe characters inside the voice folder', () => {
    expect(fingerprint('Why can\'t you call a hook inside an if statement?')).toMatch(/^[0-9a-f]{16}$/);
    expect(narrationPath('Hello hooks.')).toMatch(/^af_heart\/[0-9a-f]{16}\.mp3$/);
  });

  it('builds the public address, or nothing when Supabase is not set up', () => {
    expect(narrationUrl('', 'Hello hooks.')).toBeNull();
    expect(narrationUrl('https://x.supabase.co', 'Hello hooks.')).toBe(
      `https://x.supabase.co/storage/v1/object/public/narration/${narrationPath('Hello hooks.')}`,
    );
  });
});
