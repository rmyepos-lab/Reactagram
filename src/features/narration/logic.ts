/**
 * Where the recorded voice for a narration line lives. The files are made offline by
 * scripts/build-narration.ts, which uses these same functions, so names always match.
 */

/** The recorded voice. Changing it changes every file path, so old files are never reused. */
export const NARRATION_VOICE = 'af_heart';

/** Storage bucket (public) that holds the files. Created in supabase/setup.sql. */
export const NARRATION_BUCKET = 'narration';

/* eslint-disable no-bitwise -- the fingerprint below is built from bit operations */

/** A short, stable fingerprint of a text (cyrb53): the same text always gives the same result. */
export function fingerprint(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const high = (h2 >>> 0).toString(16).padStart(8, '0');
  const low = (h1 >>> 0).toString(16).padStart(8, '0');
  return high + low;
}

/** Path of a line's file inside the bucket, e.g. "af_heart/0f3a….mp3". */
export function narrationPath(text: string): string {
  return `${NARRATION_VOICE}/${fingerprint(text.trim())}.mp3`;
}

/** The narration Worker (workers/narration) that serves one recorded MP3 per reel. */
export const NARRATION_STORE = 'https://hookd-narration.narration.workers.dev';

/** One recorded reel: its file in the store, and each line's place in it (ms) by line fingerprint. */
export type ReelNarration = { file: string; lines: Record<string, [number, number]> };
/** content/narration.json, written by scripts/upload-narration.ts for the reels stored in the Worker. */
export type NarrationIndex = { voice: string; reels: Record<string, ReelNarration> };

/**
 * Where a line is inside its reel's recording, in seconds. Null when the reel isn't recorded,
 * or was recorded with another voice or before its text changed.
 */
export function reelLine(
  index: NarrationIndex,
  reelId: string,
  text: string,
): { url: string; offset: number; duration: number } | null {
  const reel = index.voice === NARRATION_VOICE ? index.reels[reelId] : undefined;
  const span = reel?.lines[fingerprint(text.trim())];
  if (!reel || !span || span[1] <= span[0]) {
    return null;
  }
  return { url: `${NARRATION_STORE}/${reel.file}`, offset: span[0] / 1000, duration: (span[1] - span[0]) / 1000 };
}

/** Public address of a line's file, or null when Supabase isn't set up. */
export function narrationUrl(supabaseUrl: string, text: string): string | null {
  if (!supabaseUrl) {
    return null;
  }
  return `${supabaseUrl}/storage/v1/object/public/${NARRATION_BUCKET}/${narrationPath(text)}`;
}
