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

/** Public address of a line's file, or null when Supabase isn't set up. */
export function narrationUrl(supabaseUrl: string, text: string): string | null {
  if (!supabaseUrl) {
    return null;
  }
  return `${supabaseUrl}/storage/v1/object/public/${NARRATION_BUCKET}/${narrationPath(text)}`;
}
