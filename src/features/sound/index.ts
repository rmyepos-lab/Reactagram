import { AudioContext } from 'react-native-audio-api';

type Note = { freq: number; at: number; length: number; type?: 'sine' | 'triangle' };

/** Short sounds made from plain tones, so the app ships no sound files. Times are in seconds. */
const SOUNDS = {
  /** Two rising notes. */
  correct: [
    { freq: 659.25, at: 0, length: 0.12 },
    { freq: 987.77, at: 0.1, length: 0.24 },
  ],
  /** Two low falling notes. */
  wrong: [
    { freq: 196, at: 0, length: 0.14, type: 'triangle' },
    { freq: 155.56, at: 0.12, length: 0.26, type: 'triangle' },
  ],
  /** A small rising chord for the end of a quiz. */
  finish: [
    { freq: 523.25, at: 0, length: 0.14 },
    { freq: 659.25, at: 0.1, length: 0.14 },
    { freq: 783.99, at: 0.2, length: 0.14 },
    { freq: 1046.5, at: 0.3, length: 0.36 },
  ],
} satisfies Record<string, Note[]>;

export type SoundName = keyof typeof SOUNDS;

const VOLUME = 0.2;
const FADE_IN = 0.01;
const SILENT = 0.0001;

let context: AudioContext | null = null;

/** Plays a sound effect. The caller checks the mute setting. A failure is silent. */
export function playSound(name: SoundName): void {
  try {
    context ??= new AudioContext();
    const ctx = context;
    const play = () => {
      for (const note of SOUNDS[name] as Note[]) {
        const start = ctx.currentTime + note.at;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = note.type ?? 'sine';
        oscillator.frequency.value = note.freq;
        // Fade in and out so the note doesn't click.
        gain.gain.setValueAtTime(SILENT, start);
        gain.gain.linearRampToValueAtTime(VOLUME, start + FADE_IN);
        gain.gain.exponentialRampToValueAtTime(SILENT, start + note.length);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + note.length);
      }
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => undefined);
    } else {
      play();
    }
  } catch {
    // Sound effects are optional.
  }
}
