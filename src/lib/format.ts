/** "beginner" -> "Beginner". */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Seconds -> "0:42". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Rough speaking time of a sentence, used when text-to-speech is muted or unavailable. */
export function speakingSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2.5, words / 2.6);
}
