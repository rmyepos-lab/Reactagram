"use client";
/**
 * Free voice-over using the browser's built-in speech engine (Web Speech API).
 * No audio files, no API cost. Falls back to a reading-speed timer when muted
 * or unsupported, so reels still advance at a natural pace.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Narrator = {
  /** User has tapped once (browsers require a gesture before speech). */
  started: boolean;
  start: () => void;
  muted: boolean;
  toggleMute: () => void;
  supported: boolean;
  /** Speak text; resolves `onDone` when finished (or after a reading-time timer). Returns a cancel fn. */
  speak: (text: string, onDone: () => void) => () => void;
  stop: () => void;
};

const Ctx = createContext<Narrator | null>(null);
const MUTE_KEY = "reactagram.muted";

export function readingTime(text: string) {
  return Math.min(9000, 1400 + text.split(/\s+/).length * 330);
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const preferred = ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Daniel", "Karen"];
  for (const name of preferred) {
    const v = voices.find((v) => v.name.includes(name));
    if (v) return v;
  }
  return voices.find((v) => v.localService) ?? voices[0];
}

export function NarratorProvider({ children }: { children: ReactNode }) {
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(false);
  const voice = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(ok);
    try {
      setMuted(localStorage.getItem(MUTE_KEY) === "1");
    } catch {}
    if (!ok) return;
    const update = () => (voice.current = pickVoice());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const start = useCallback(() => {
    setStarted(true);
    // Unlock audio on iOS: speak an empty utterance inside the tap handler.
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {}
      if (next) stop();
      return next;
    });
  }, [stop]);

  const speak = useCallback(
    (text: string, onDone: () => void) => {
      let finished = false;
      let safety: ReturnType<typeof setTimeout> | undefined;
      let wait: ReturnType<typeof setTimeout> | undefined;
      const fallbackMs = readingTime(text);
      const startedAt = Date.now();
      const minMs = fallbackMs * 0.6;
      const done = () => {
        if (finished) return;
        // If speech failed or ended suspiciously fast (no voices installed), keep the slide up long enough to read.
        const left = minMs - (Date.now() - startedAt);
        if (left > 0) {
          clearTimeout(wait);
          wait = setTimeout(done, left);
          return;
        }
        finished = true;
        clearTimeout(safety);
        onDone();
      };

      if (muted || !supported) {
        safety = setTimeout(done, fallbackMs);
        return () => {
          finished = true;
          clearTimeout(safety);
          clearTimeout(wait);
        };
      }

      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice.current) u.voice = voice.current;
      u.lang = voice.current?.lang ?? "en-US";
      u.rate = 1.05;
      u.onend = () => setTimeout(done, 450);
      u.onerror = () => setTimeout(done, 300);
      // Some engines never fire onend; never let a reel get stuck.
      safety = setTimeout(done, fallbackMs * 2.2 + 2000);
      current.current = u;
      synth.speak(u);
      return () => {
        finished = true;
        clearTimeout(safety);
        clearTimeout(wait);
        u.onend = null;
        u.onerror = null;
        // Only stop the voice if it's still ours (a newer line may already be playing).
        if (current.current === u) {
          current.current = null;
          synth.cancel();
        }
      };
    },
    [muted, supported],
  );

  const value = useMemo(() => ({ started, start, muted, toggleMute, supported, speak, stop }), [started, start, muted, toggleMute, supported, speak, stop]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNarrator() {
  const n = useContext(Ctx);
  if (!n) throw new Error("useNarrator must be used inside NarratorProvider");
  return n;
}
