import { addDays, dayKey } from '../../lib/date';

export type Progress = {
  xp: number;
  streak: number;
  lastActiveDay: string | null;
  /** Seconds spent in reels on `lastActiveDay`, for the daily goal. */
  secondsToday: number;
  seen: string[];
  /** reel id -> when the learner last watched it (ISO time), for spacing repeats in the feed. */
  seenAt: Record<string, string>;
  /** Reels the learner saved, oldest first. */
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
  seenAt: {},
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

/** Records a watch. XP only the first time; every watch updates `seenAt`. */
export function markSeen(p: Progress, id: string, now: Date): Progress {
  const next = touchDay(p, now);
  const seenAt = { ...next.seenAt, [id]: now.toISOString() };
  if (next.seen.includes(id)) {
    return { ...next, seenAt };
  }
  return { ...next, seen: [...next.seen, id], seenAt, xp: next.xp + XP.learn };
}

export function addSeconds(p: Progress, seconds: number, now: Date): Progress {
  const next = touchDay(p, now);
  return { ...next, secondsToday: next.secondsToday + seconds };
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter(x => x !== id) : [...list, id];

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

/**
 * Where the learner stands with one post: `new`, `watched` (lesson), `right` (last answer right),
 * `missed` (last answer wrong, not back yet) or `back` (a missed question back for review today).
 */
export type PostStatus = 'new' | 'watched' | 'right' | 'missed' | 'back';

export function postStatus(p: Progress, post: { id: string; kind: 'learn' | 'quiz' }, now: Date): PostStatus {
  if (post.kind === 'learn') {
    return p.seen.includes(post.id) ? 'watched' : 'new';
  }
  if (isDue(p, post.id, now)) {
    return 'back';
  }
  const last = p.answered[post.id];
  return !last ? 'new' : last.correct ? 'right' : 'missed';
}

/** XP a post can still earn, shown only where it's worth going for: new posts and questions back today. */
export function postXp(kind: 'learn' | 'quiz', status: PostStatus): number | null {
  if (status === 'new') {
    return kind === 'learn' ? XP.learn : XP.quizFirstTry;
  }
  return status === 'back' ? XP.quizReview : null;
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

/**
 * Missed questions that are back today: the ones waiting longest first, at most `limit`.
 * `exists` leaves out questions no longer in the content.
 */
export function missedQuestionIds(
  p: Progress,
  now: Date,
  exists: (id: string) => boolean,
  limit: number,
): string[] {
  const today = dayKey(now);
  return Object.entries(p.review)
    .filter(([id, r]) => r.due <= today && exists(id))
    .sort(([a, ra], [b, rb]) => ra.due.localeCompare(rb.due) || a.localeCompare(b))
    .slice(0, limit)
    .map(([id]) => id);
}

/** Share of answered quizzes whose latest answer was right, 0 to 1 (null if none yet). */
export function quizAccuracy(p: Progress): number | null {
  const all = Object.values(p.answered);
  if (all.length === 0) {
    return null;
  }
  return all.filter(a => a.correct).length / all.length;
}

/** A watched lesson counts as "just seen" for this long, and goes to the very end of the feed. */
export const FEED_COOLDOWN_HOURS = 24;
/** Each saved reel in a topic raises that topic's share of the feed, up to this many times. */
export const SAVED_TOPIC_BOOST_CAP = 3;

const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;

export type FeedReel = {
  id: string;
  topic: string;
  concept: string;
  level: keyof typeof LEVEL_RANK;
};

export type FeedOptions = {
  now: Date;
  /** Shown first, if it is in the list. */
  startId?: string;
  /** Concepts a learner should have seen before this one. */
  requires?: (concept: string) => readonly string[];
  /** The topic of each saved reel (duplicates count): saved topics get a bigger share. */
  savedTopics?: readonly string[];
  /** Reels already in the feed this session: scrolled past or not, they count as just seen. */
  shown?: ReadonlySet<string>;
  /** Breaks ties between topics, so each round starts on a different topic. */
  seed?: string;
};

/**
 * One round of the Learn feed:
 * 1. the reel the learner asked for;
 * 2. lessons not watched yet: beginner, then intermediate, then advanced, never before a
 *    prerequisite that is also waiting;
 * 3. lessons watched more than FEED_COOLDOWN_HOURS ago, longest ago first;
 * 4. lessons watched recently, or already shown this session.
 * Inside each group topics are mixed, never the same topic twice in a row when another is left,
 * and topics the learner saved reels from come up more often.
 */
export function planLearnFeed<T extends FeedReel>(items: readonly T[], p: Progress, opts: FeedOptions): T[] {
  const { now, startId, requires = () => [], savedTopics = [], shown = new Set(), seed = '' } = opts;
  const seen = new Set(p.seen);
  const start = items.find(r => r.id === startId);
  const rest = items.filter(r => r !== start);

  const depth = conceptDepth(requires);

  const watchedAt = (r: T) => Date.parse(p.seenAt[r.id] ?? '') || 0;
  const cooldownStart = now.getTime() - FEED_COOLDOWN_HOURS * 3600_000;
  const isRecent = (r: T) => shown.has(r.id) || (seen.has(r.id) && watchedAt(r) >= cooldownStart);
  const unseen = rest.filter(r => !seen.has(r.id) && !isRecent(r));
  const old = rest.filter(r => seen.has(r.id) && !isRecent(r));
  const recent = rest.filter(isRecent);

  const position = new Map(items.map((r, i) => [r.id, i]));
  const byOrder = (a: T, b: T) => position.get(a.id)! - position.get(b.id)!;
  const lessonOrder = (a: T, b: T) =>
    LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || depth(a.concept) - depth(b.concept) || byOrder(a, b);
  const oldestFirst = (a: T, b: T) => watchedAt(a) - watchedAt(b) || byOrder(a, b);

  const boost = new Map<string, number>();
  for (const topic of savedTopics) {
    boost.set(topic, Math.min((boost.get(topic) ?? 0) + 1, SAVED_TOPIC_BOOST_CAP));
  }
  const mix = (group: T[], order: (a: T, b: T) => number) =>
    mixTopics(group.sort(order), topic => 1 + (boost.get(topic) ?? 0), seed);

  // Concepts the learner has met: watched, or placed earlier in this round.
  const met = new Set(items.filter(r => seen.has(r.id)).map(r => r.concept));
  if (start) {
    met.add(start.concept);
  }
  // New lessons go level by level, so a beginner doesn't meet advanced topics early.
  // Lessons from saved topics move up one level, so they come sooner.
  const band = (r: T) => Math.max(0, LEVEL_RANK[r.level] - (boost.has(r.topic) ? 1 : 0));
  const byLevel = [0, 1, 2].flatMap(b =>
    mix(
      unseen.filter(r => band(r) === b),
      lessonOrder,
    ),
  );
  return [
    ...(start ? [start] : []),
    ...prerequisitesFirst(byLevel, requires, met),
    ...mix(old, oldestFirst),
    ...mix(recent, oldestFirst),
  ];
}

/**
 * Holds a lesson back until every prerequisite that is also in `list` has come before it.
 * Prerequisites without a lesson in the list never hold anything back. Keeps the order otherwise.
 */
function prerequisitesFirst<T extends FeedReel>(
  list: readonly T[],
  requires: (concept: string) => readonly string[],
  met: Set<string>,
): T[] {
  const inList = new Set(list.map(r => r.concept));
  const ready = (r: T) => requires(r.concept).every(c => met.has(c) || !inList.has(c));
  const out: T[] = [];
  let waiting: T[] = [];
  const place = (r: T) => {
    out.push(r);
    met.add(r.concept);
  };
  for (const item of list) {
    if (!ready(item)) {
      waiting.push(item);
      continue;
    }
    place(item);
    // Placing one lesson can free others; keep going until nothing more is ready.
    let freed = waiting.filter(ready);
    while (freed.length > 0) {
      waiting = waiting.filter(r => !freed.includes(r));
      freed.forEach(place);
      freed = waiting.filter(ready);
    }
  }
  return [...out, ...waiting];
}

/** Longest chain of prerequisites below a concept (0 = needs nothing). Cycles count once. */
function conceptDepth(requires: (concept: string) => readonly string[]) {
  const memo = new Map<string, number>();
  const depth = (concept: string, path: Set<string>): number => {
    const known = memo.get(concept);
    if (known !== undefined) {
      return known;
    }
    if (path.has(concept)) {
      return 0;
    }
    path.add(concept);
    const d = Math.max(0, ...requires(concept).map(c => depth(c, path) + 1));
    path.delete(concept);
    memo.set(concept, d);
    return d;
  };
  return (concept: string) => depth(concept, new Set());
}

/**
 * Interleaves already-sorted items by topic (smooth weighted round-robin). A topic's share is its
 * item count times `weight(topic)`, so big topics spread across the whole round instead of
 * piling up at the end. The same topic never comes twice in a row while another one is left.
 */
export function mixTopics<T extends { topic: string }>(
  sorted: readonly T[],
  weight: (topic: string) => number,
  seed = '',
): T[] {
  const queues = new Map<string, T[]>();
  for (const item of sorted) {
    queues.set(item.topic, [...(queues.get(item.topic) ?? []), item]);
  }
  const tieBreak = (topic: string) => hashString(`${seed}|${topic}`);
  const topicsList = [...queues.keys()].sort((a, b) => tieBreak(a) - tieBreak(b));
  const share = new Map(topicsList.map(t => [t, queues.get(t)!.length * weight(t)]));
  const credit = new Map(topicsList.map(t => [t, 0]));

  const out: T[] = [];
  let last: string | null = null;
  while (out.length < sorted.length) {
    const open = topicsList.filter(t => queues.get(t)!.length > 0);
    const total = open.reduce((sum, t) => sum + share.get(t)!, 0);
    for (const t of open) {
      credit.set(t, credit.get(t)! + share.get(t)!);
    }
    const choices = open.length > 1 ? open.filter(t => t !== last) : open;
    const pick = choices.reduce((best, t) => (credit.get(t)! > credit.get(best)! ? t : best));
    credit.set(pick, credit.get(pick)! - total);
    out.push(queues.get(pick)!.shift()!);
    last = pick;
  }
  return out;
}

/* eslint-disable no-bitwise -- a string hash needs bit operations */
function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
/* eslint-enable no-bitwise */
