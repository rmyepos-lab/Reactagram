import Speech from '@mhpdev/react-native-speech';
import { AudioContext } from 'react-native-audio-api';
import type { AudioBuffer, AudioBufferSourceNode } from 'react-native-audio-api';
import { env } from '../../config/env';
import { speakingSeconds } from '../../lib/format';
import narrationJson from '../../../content/narration.json';
import { narrationUrl, reelLine } from './logic';
import type { NarrationIndex } from './logic';

// JSON arrays load as number[], not the [offset, duration] pair the index type uses.
const narrationIndex = narrationJson as unknown as NarrationIndex;

type Cancel = () => void;
type SpeechEvent = { id: string };
type Subscribe = (handler: (event: SpeechEvent) => void) => { remove: () => void };

// React Native 0.87 hides the deep-import types this library uses for its events, so they
// arrive untyped. The shape below is the one in the library's NativeSpeech spec.
const onFinish = Speech.onFinish as Subscribe;
const onError = Speech.onError as Subscribe;

/** How many downloaded files (reels or lines) stay in memory, so replaying doesn't download again. */
// A decoded reel takes about 10 MB of memory, so only a few are kept.
const KEPT_LINES = 3;
const loaded = new Map<string, Promise<AudioBuffer>>();
let context: AudioContext | null = null;

/** Downloads and decodes one recorded line. Failed downloads are forgotten so they can retry. */
function load(url: string): Promise<AudioBuffer> {
  const known = loaded.get(url);
  if (known) {
    return known;
  }
  // Decoding through the context converts the file to the phone's playback rate. Decoded
  // on its own, a 24 kHz recording would play about twice too fast.
  context ??= new AudioContext();
  const loading = context.decodeAudioData(url);
  loaded.set(url, loading);
  loading.catch(() => loaded.delete(url));
  if (loaded.size > KEPT_LINES) {
    const oldest = loaded.keys().next().value;
    if (oldest !== undefined) {
      loaded.delete(oldest);
    }
  }
  return loading;
}

/**
 * Speaks one line and calls `onDone` when it ends. With `reelId`, it plays the line's part of
 * that reel's recording (one MP3 per reel, see content/narration.json). Otherwise, or when the
 * reel isn't recorded, it plays the line's own recording when Supabase is set up. If no file
 * can be loaded it uses the phone's own text-to-speech. If the phone has no voice either, or `silent` is true, it waits for the
 * time the line would take instead, so reels keep their pace. Returns a function that
 * cancels everything.
 */
export function narrate(text: string, onDone: () => void, silent = false, reelId?: string): Cancel {
  let finished = false;
  let speechId: string | null = null;
  let usedPhoneVoice = false;
  let player: AudioBufferSourceNode | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const subs: { remove: () => void }[] = [];

  const cleanup = () => {
    subs.forEach(s => s.remove());
    subs.length = 0;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (player) {
      player.onEnded = null;
      player = null;
    }
  };
  const done = () => {
    if (finished) {
      return;
    }
    finished = true;
    cleanup();
    onDone();
  };
  const waitInstead = () => {
    timer = setTimeout(done, speakingSeconds(text) * 1000);
  };

  const speakWithPhone = () => {
    usedPhoneVoice = true;
    const endIfMine = (e: SpeechEvent) => {
      if (e.id === speechId) {
        done();
      }
    };
    subs.push(onFinish(endIfMine), onError(endIfMine));
    Speech.stop()
      .catch(() => undefined)
      .then(() => (finished ? null : Speech.speak(text)))
      .then(id => {
        speechId = id;
      })
      .catch(() => {
        if (!finished) {
          waitInstead();
        }
      });
  };

  // `part` plays only that stretch of the file (seconds), for a line inside a reel's recording.
  const playRecording = (url: string, part?: { offset: number; duration: number }) => {
    load(url)
      .then(async buffer => {
        if (finished) {
          return;
        }
        context ??= new AudioContext();
        if (context.state === 'suspended') {
          await context.resume();
        }
        if (finished) {
          return;
        }
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.onEnded = done;
        if (part) {
          // The library ends the part at `when + duration` on the context's clock, so `when`
          // has to be the current time: with 0 the part would already be over.
          source.start(context.currentTime, part.offset, part.duration);
        } else {
          source.start();
        }
        player = source;
      })
      .catch(() => {
        if (!finished) {
          speakWithPhone();
        }
      });
  };

  if (silent) {
    waitInstead();
  } else {
    const inReel = reelId ? reelLine(narrationIndex, reelId, text) : null;
    const url = narrationUrl(env.supabaseUrl, text);
    if (inReel) {
      playRecording(inReel.url, inReel);
    } else if (url) {
      playRecording(url);
    } else {
      speakWithPhone();
    }
  }

  return () => {
    if (finished) {
      return;
    }
    finished = true;
    const playing = player;
    cleanup();
    if (playing) {
      try {
        playing.stop();
      } catch {
        // Already stopped: nothing to do.
      }
    }
    if (usedPhoneVoice) {
      Speech.stop().catch(() => undefined);
    }
  };
}

export function configureNarration() {
  Speech.configure({ language: 'en-US', ducking: true });
}
