import { isDue, type Progress } from '../progress/logic';

export type Level = 'beginner' | 'intermediate' | 'advanced';
export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

/** A quiz never has more questions than this, and never the same question twice. */
export const QUIZ_SIZE = 10;

/** What the learner picked on the setup screen. An empty list means "all". */
export type QuizConfig = { levels: Level[]; topics: string[] };
export const ANY_QUIZ: QuizConfig = { levels: [], topics: [] };

export type QuizSession = {
  config: QuizConfig;
  /** Question ids, in play order. */
  ids: string[];
  /** Question id -> answered correctly. */
  answers: Record<string, boolean>;
  startedAt: string;
};

type Question = { id: string; topic: string; level: Level; concept: string };

const inTopics = (q: Question, c: QuizConfig) => c.topics.length === 0 || c.topics.includes(q.topic);
const inLevels = (q: Question, c: QuizConfig) => c.levels.length === 0 || c.levels.includes(q.level);

/** How many questions fit the choice exactly (before filling from nearby levels). */
export function countMatching(pool: readonly Question[], config: QuizConfig): number {
  return pool.filter(q => inTopics(q, config) && inLevels(q, config)).length;
}

function shuffle<T>(list: readonly T[], random: () => number): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Due reviews first, then never answered, then answered longest ago. Random inside a tie. */
function byNeed<T extends Question>(list: readonly T[], p: Progress, now: Date, random: () => number): T[] {
  const rank = (q: T) => (isDue(p, q.id, now) ? 0 : p.answered[q.id] ? 2 : 1);
  const lastAt = (q: T) => p.answered[q.id]?.at ?? '';
  return shuffle(list, random).sort(
    (a, b) => rank(a) - rank(b) || lastAt(a).localeCompare(lastAt(b)),
  );
}

/** Reorders so two questions about the same concept are not back to back, when possible. */
function spreadConcepts<T extends Question>(list: readonly T[]): T[] {
  const left = list.slice();
  const out: T[] = [];
  while (left.length > 0) {
    const previous = out[out.length - 1]?.concept;
    const i = left.findIndex(q => q.concept !== previous);
    out.push(left.splice(i === -1 ? 0 : i, 1)[0]);
  }
  return out;
}

/**
 * Picks the questions of a new quiz: at most QUIZ_SIZE, all different.
 * If the chosen levels don't have enough questions, it fills up from the nearest other
 * levels of the same topics. It never adds topics the learner didn't choose.
 */
export function buildQuiz<T extends Question>(
  pool: readonly T[],
  config: QuizConfig,
  p: Progress,
  now: Date,
  random: () => number = Math.random,
): string[] {
  const topicPool = pool.filter(q => inTopics(q, config));
  const exact = byNeed(topicPool.filter(q => inLevels(q, config)), p, now, random);

  const distance = (q: T) =>
    Math.min(...config.levels.map(l => Math.abs(LEVELS.indexOf(l) - LEVELS.indexOf(q.level))));
  const nearby = byNeed(topicPool.filter(q => !inLevels(q, config)), p, now, random).sort(
    (a, b) => distance(a) - distance(b),
  );

  return spreadConcepts([...exact, ...nearby].slice(0, QUIZ_SIZE)).map(q => q.id);
}

export function startSession(ids: string[], config: QuizConfig, now: Date): QuizSession {
  return { config, ids, answers: {}, startedAt: now.toISOString() };
}

export function recordAnswer(s: QuizSession, id: string, correct: boolean): QuizSession {
  // The first answer counts: a question is asked once per quiz.
  if (!s.ids.includes(id) || id in s.answers) {
    return s;
  }
  return { ...s, answers: { ...s.answers, [id]: correct } };
}

/** Questions still to answer, in play order. */
/** Short label of a quiz's settings, like "Beginner · Hooks, State" or "Any level · 4 topics". */
export function configLabel(c: QuizConfig): string {
  const level =
    c.levels.length === 0
      ? 'Any level'
      : c.levels.map(l => l[0].toUpperCase() + l.slice(1)).join(', ');
  const topic =
    c.topics.length === 0 ? 'All topics' : c.topics.length <= 2 ? c.topics.join(', ') : `${c.topics.length} topics`;
  return `${level} · ${topic}`;
}

export const remainingIds =(s: QuizSession): string[] => s.ids.filter(id => !(id in s.answers));
export const isFinished = (s: QuizSession): boolean => remainingIds(s).length === 0;
export const answeredCount = (s: QuizSession): number => s.ids.length - remainingIds(s).length;
export const correctCount = (s: QuizSession): number =>
  s.ids.filter(id => s.answers[id] === true).length;

/** Drops questions that no longer exist (content changed in an app update). */
export function pruneSession(s: QuizSession, exists: (id: string) => boolean): QuizSession | null {
  const ids = s.ids.filter(exists);
  if (ids.length === s.ids.length) {
    return s;
  }
  return ids.length === 0 ? null : { ...s, ids };
}

export type Grade = 'strong' | 'fair' | 'weak';
/** Share of right answers needed for each grade. */
export const GRADE_MIN = { strong: 0.8, fair: 0.5 } as const;
export const gradeOf = (right: number, total: number): Grade => {
  const share = total === 0 ? 0 : right / total;
  return share >= GRADE_MIN.strong ? 'strong' : share >= GRADE_MIN.fair ? 'fair' : 'weak';
};

export type Score = { right: number; total: number; grade: Grade };
export type Evaluation = {
  overall: Score;
  /** One line per topic of the quiz, weakest first. */
  byTopic: (Score & { topic: string })[];
  /** Only the levels that had questions, easiest first. */
  byLevel: (Score & { level: Level })[];
  /** Concepts with at least one wrong answer, most misses first. */
  missedConcepts: string[];
};

/** What the answers of a quiz say about the learner's understanding. Unanswered questions don't count. */
export function evaluate(s: QuizSession, questions: readonly Question[]): Evaluation {
  const asked = questions.filter(q => q.id in s.answers);
  const score = (list: readonly Question[]): Score => {
    const right = list.filter(q => s.answers[q.id]).length;
    return { right, total: list.length, grade: gradeOf(right, list.length) };
  };
  const share = (x: Score) => x.right / x.total;

  const byTopic = [...new Set(asked.map(q => q.topic))]
    .map(topic => ({ topic, ...score(asked.filter(q => q.topic === topic)) }))
    .sort((a, b) => share(a) - share(b) || b.total - a.total);

  const byLevel = LEVELS.map(level => ({ level, ...score(asked.filter(q => q.level === level)) })).filter(
    x => x.total > 0,
  );

  const misses = new Map<string, number>();
  for (const q of asked) {
    if (!s.answers[q.id]) {
      misses.set(q.concept, (misses.get(q.concept) ?? 0) + 1);
    }
  }
  const missedConcepts = [...misses].sort((a, b) => b[1] - a[1]).map(([concept]) => concept);

  return { overall: score(asked), byTopic, byLevel, missedConcepts };
}
