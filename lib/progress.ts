"use client";
/**
 * Local progress store (XP, streak, seen/liked/saved, spaced-repetition queue).
 * Lives in localStorage for now; step 3 syncs it to Supabase for logged-in users.
 */
import { useSyncExternalStore } from "react";

export type Progress = {
  xp: number;
  streak: number;
  lastActiveDay: string | null;
  seen: string[];
  liked: string[];
  saved: string[];
  answered: Record<string, { correct: boolean; at: string }>;
  /** quiz id -> ISO date when it should come back (wrong answers: 1, 3, 7 days). */
  review: Record<string, { due: string; step: number }>;
};

const KEY = "reactagram.progress.v1";
const EMPTY: Progress = { xp: 0, streak: 0, lastActiveDay: null, seen: [], liked: [], saved: [], answered: {}, review: {} };
const REVIEW_DAYS = [1, 3, 7];

let state: Progress = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* private mode or corrupt data: start fresh */
  }
}

function save(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
  listeners.forEach((l) => l());
}

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

function touchStreak(p: Progress): Progress {
  const d = today();
  if (p.lastActiveDay === d) return p;
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  return { ...p, lastActiveDay: d, streak: p.lastActiveDay === yesterday ? p.streak + 1 : 1 };
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const progress = {
  get: () => (load(), state),
  subscribe(l: () => void) {
    load();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  markSeen(id: string, xp = 5) {
    load();
    if (state.seen.includes(id)) return;
    save(touchStreak({ ...state, seen: [...state.seen, id], xp: state.xp + xp }));
  },
  toggleLike: (id: string) => (load(), save({ ...state, liked: toggle(state.liked, id) })),
  toggleSave: (id: string) => (load(), save({ ...state, saved: toggle(state.saved, id) })),
  answer(id: string, correct: boolean) {
    load();
    const review = { ...state.review };
    const prev = review[id];
    if (!correct) {
      review[id] = { due: addDays(REVIEW_DAYS[0]), step: 0 };
    } else if (prev) {
      const step = prev.step + 1;
      if (step >= REVIEW_DAYS.length) delete review[id];
      else review[id] = { due: addDays(REVIEW_DAYS[step]), step };
    }
    const firstTime = !state.answered[id];
    save(
      touchStreak({
        ...state,
        review,
        answered: { ...state.answered, [id]: { correct, at: new Date().toISOString() } },
        seen: state.seen.includes(id) ? state.seen : [...state.seen, id],
        xp: state.xp + (correct ? (firstTime ? 10 : 5) : 1),
      }),
    );
  },
  isDue: (id: string) => {
    const r = state.review[id];
    return !!r && r.due <= today();
  },
};

export function useProgress(): Progress {
  return useSyncExternalStore(progress.subscribe, progress.get, () => EMPTY);
}

/** Order a feed: due reviews first, then unseen, then already-seen. Stable within groups. */
export function orderFeed<T extends { id: string }>(items: T[], p: Progress, startId?: string): T[] {
  const rank = (it: T) => {
    if (it.id === startId) return -1;
    const r = p.review[it.id];
    if (r && r.due <= today()) return 0;
    if (!p.seen.includes(it.id)) return 1;
    return 2;
  };
  return items.map((it, i) => ({ it, i, r: rank(it) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.it);
}
