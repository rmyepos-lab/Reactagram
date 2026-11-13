import Speech from '@mhpdev/react-native-speech';
import { speakingSeconds } from '../../lib/format';

type Cancel = () => void;
type SpeechEvent = { id: string };
type Subscribe = (handler: (event: SpeechEvent) => void) => { remove: () => void };

// React Native 0.87 hides the deep-import types this library uses for its events, so they
// arrive untyped. The shape below is the one in the library's NativeSpeech spec.
const onFinish = Speech.onFinish as Subscribe;
const onError = Speech.onError as Subscribe;

/**
 * Speaks one line with the phone's own text-to-speech and calls `onDone` when it ends.
 * If the phone has no voice, or `silent` is true, it waits for the time the line would
 * take instead, so reels keep their pace. Returns a function that cancels everything.
 */
export function narrate(text: string, onDone: () => void, silent = false): Cancel {
  let finished = false;
  let speechId: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const subs: { remove: () => void }[] = [];

  const cleanup = () => {
    subs.forEach(s => s.remove());
    subs.length = 0;
    if (timer) {
      clearTimeout(timer);
      timer = null;
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

  if (silent) {
    waitInstead();
  } else {
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
  }

  return () => {
    if (finished) {
      return;
    }
    finished = true;
    cleanup();
    if (!silent) {
      Speech.stop().catch(() => undefined);
    }
  };
}

export function configureNarration() {
  Speech.configure({ language: 'en-US', ducking: true });
}
