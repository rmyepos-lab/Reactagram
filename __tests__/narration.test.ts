import {
  NARRATION_STORE,
  NARRATION_VOICE,
  fingerprint,
  narrationPath,
  narrationUrl,
  reelLine,
} from '../src/features/narration/logic';

describe('lines inside a reel recording', () => {
  const index = {
    voice: NARRATION_VOICE,
    reels: {
      'use-state': {
        file: `${NARRATION_VOICE}/use-state-0123456789.mp3`,
        lines: { [fingerprint('First line.')]: [0, 1500], [fingerprint('Second line.')]: [1900, 4000] } as Record<
          string,
          [number, number]
        >,
      },
    },
  };

  it('finds a line by its text, in seconds', () => {
    expect(reelLine(index, 'use-state', ' Second line. ')).toEqual({
      url: `${NARRATION_STORE}/${NARRATION_VOICE}/use-state-0123456789.mp3`,
      offset: 1.9,
      duration: 2.1,
    });
  });

  it('gives null for an unrecorded reel, a changed line or another voice', () => {
    expect(reelLine(index, 'use-effect', 'First line.')).toBeNull();
    expect(reelLine(index, 'use-state', 'A rewritten line.')).toBeNull();
    expect(reelLine({ ...index, voice: 'other' }, 'use-state', 'First line.')).toBeNull();
  });
});

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
