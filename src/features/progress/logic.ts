import { addDays, dayKey } from '../../lib/date';

export type Progress = {
  xp: number;
  streak: number;
  lastActiveDay: string | null;
  /** Seconds spent in reels on `lastActiveDay`, for the daily goal. */
  secondsToday: number;
  seen: string[];
  liked: string[];
  saved: string[];
  answered: Record<string, { correct: boolean; at: string }>;
  /** quiz id -> day it comes back, and which review step it is on. */
  review: Record<string, { due: string; step: number }>;
};

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  streak: 0,
  lastActiveDay: null,
  secondsToday: 0,
  seen: [],
  liked: [],
  saved: [],
  answered: {},
  review: {},
};

/** A wrong answer comes back after 1, 3 and 7 days. */
export const REVIEW_DAYS = [1, 3, 7] as const;
export const XP = { learn: 5, quizFirstTry: 10, quizReview: 5, quizWrong: 1 } as const;

/** Start a new day if needed: update the streak and reset today's timer. */
export function touchDay(p: Progress, now: Date): Progress {
  const today = dayKey(now);
  if (p.lastActiveDay === today) {
    return p;
  }
  const yesterday = dayKey(addDays(now, -1));
  return {
    ...p,
    lastActiveDay: today,
    secondsToday: 0,
    streak: p.lastActiveDay === yesterday ? p.streak + 1 : 1,
  };
}

export function markSeen(p: Progress, id: string, now: Date): Progress {
  if (p.seen.includes(id)) {
    return p;
  }
  const next = touchDay(p, now);
  return { ...next, seen: [...next.seen, id], xp: next.xp + XP.learn };
}

export function addSeconds(p: Progress, seconds: number, now: Date): Progress {
  const next = touchDay(p, now);
  return { ...next, secondsToday: next.secondsToday + seconds };
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter(x => x !== id) : [...list, id];

export const toggleLike = (p: Progress, id: string): Progress => ({
  ...p,
  liked: toggle(p.liked, id),
});
export const toggleSave = (p: Progress, id: string): Progress => ({
  ...p,
  saved: toggle(p.saved, id),
});

export function answerQuiz(p: Progress, id: string, correct: boolean, now: Date): Progress {
  const base = touchDay(p, now);
  const review = { ...base.review };
  const previous = review[id];

  if (!correct) {
    review[id] = { due: dayKey(addDays(now, REVIEW_DAYS[0])), step: 0 };
  } else if (previous) {
    const step = previous.step + 1;
    if (step >= REVIEW_DAYS.length) {
      delete review[id];
    } else {
      review[id] = { due: dayKey(addDays(now, REVIEW_DAYS[step])), step };
    }
  }

  const firstTime = !base.answered[id];
  const gained = correct ? (firstTime ? XP.quizFirstTry : XP.quizReview) : XP.quizWrong;
  return {
    ...base,
    review,
    answered: { ...base.answered, [id]: { correct, at: now.toISOString() } },
    seen: base.seen.includes(id) ? base.seen : [...base.seen, id],
    xp: base.xp + gained,
  };
}

export function isDue(p: Progress, id: string, now: Date): boolean {
  const r = p.review[id];
  return !!r && r.due <= dayKey(now);
}

/** How many quizzes are waiting for review on or before the given day. */
export function dueCount(p: Progress, now: Date): number {
  const today = dayKey(now);
  return Object.values(p.review).filter(r => r.due <= today).length;
}

/** Share of answered quizzes whose latest answer was right, 0 to 1 (null if none yet). */
export function quizAccuracy(p: Progress): number | null {
  const all = Object.values(p.answered);
  if (all.length === 0) {
    return null;
  }
  return all.filter(a => a.correct).length / all.length;
}

/** Feed order: the reel the user asked for, then due reviews, then unseen, then seen. */
export function orderFeed<T extends { id: string }>(
  items: readonly T[],
  p: Progress,
  now: Date,
  startId?: string,
): T[] {
  const rank = (item: T) => {
    if (item.id === startId) {
      return -1;
    }
    if (isDue(p, item.id, now)) {
      return 0;
    }
    return p.seen.includes(item.id) ? 2 : 1;
  };
  return items
    .map((item, index) => ({ item, index, rank: rank(item) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(x => x.item);
}
