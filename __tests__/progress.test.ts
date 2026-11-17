import {
  EMPTY_PROGRESS,
  addSeconds,
  answerQuiz,
  isDue,
  markSeen,
  missedQuestionIds,
  mixTopics,
  planLearnFeed,
  postStatus,
  postXp,
  quizAccuracy,
  touchDay,
} from '../src/features/progress/logic';

const day = (d: number) => new Date(2026, 0, d, 12);

describe('streak', () => {
  it('starts at 1, grows on the next day, resets after a gap', () => {
    let p = touchDay(EMPTY_PROGRESS, day(1));
    expect(p.streak).toBe(1);
    p = touchDay(p, day(2));
    expect(p.streak).toBe(2);
    p = touchDay(p, day(2));
    expect(p.streak).toBe(2);
    p = touchDay(p, day(5));
    expect(p.streak).toBe(1);
  });

  it("resets today's timer on a new day", () => {
    let p = addSeconds(EMPTY_PROGRESS, 120, day(1));
    expect(p.secondsToday).toBe(120);
    p = addSeconds(p, 5, day(2));
    expect(p.secondsToday).toBe(5);
  });
});

describe('quiz reviews', () => {
  it('brings a wrong answer back after 1, 3 and 7 days, then drops it', () => {
    let p = answerQuiz(EMPTY_PROGRESS, 'q', false, day(1));
    expect(p.review.q).toEqual({ due: '2026-01-02', step: 0 });
    expect(isDue(p, 'q', day(1))).toBe(false);
    expect(isDue(p, 'q', day(2))).toBe(true);

    p = answerQuiz(p, 'q', true, day(2));
    expect(p.review.q).toEqual({ due: '2026-01-05', step: 1 });
    p = answerQuiz(p, 'q', true, day(5));
    expect(p.review.q).toEqual({ due: '2026-01-12', step: 2 });
    p = answerQuiz(p, 'q', true, day(12));
    expect(p.review.q).toBeUndefined();
  });

  it('gives XP and tracks accuracy', () => {
    let p = answerQuiz(EMPTY_PROGRESS, 'a', true, day(1));
    expect(p.xp).toBe(10);
    p = answerQuiz(p, 'b', false, day(1));
    expect(p.xp).toBe(11);
    expect(quizAccuracy(p)).toBe(0.5);
    expect(quizAccuracy(EMPTY_PROGRESS)).toBeNull();
  });
});

describe('learn reels', () => {
  it('counts a reel only once', () => {
    let p = markSeen(EMPTY_PROGRESS, 'r', day(1));
    p = markSeen(p, 'r', day(1));
    expect(p.seen).toEqual(['r']);
    expect(p.xp).toBe(5);
  });
});

describe('learn feed', () => {
  type Level = 'beginner' | 'intermediate' | 'advanced';
  const reel = (id: string, topic: string, level: Level = 'beginner') => ({ id, topic, concept: id, level });
  const ids = (list: { id: string }[]) => list.map(r => r.id);
  const now = day(10);

  it('re-watching keeps the XP but updates the watch time', () => {
    let p = markSeen(EMPTY_PROGRESS, 'r', day(1));
    p = markSeen(p, 'r', day(3));
    expect(p.xp).toBe(5);
    expect(p.seenAt.r).toBe(day(3).toISOString());
  });

  it('puts the start reel first, then unseen, then watched long ago, then watched recently', () => {
    const items = ['a', 'b', 'c', 'd'].map(id => reel(id, 'T'));
    let p = markSeen(EMPTY_PROGRESS, 'a', day(8)); // 2 days ago: past the cooldown
    p = markSeen(p, 'b', now); // just now
    expect(ids(planLearnFeed(items, p, { now, startId: 'b' }))).toEqual(['b', 'c', 'd', 'a']);
    expect(ids(planLearnFeed(items, p, { now }))).toEqual(['c', 'd', 'a', 'b']);
  });

  it('shows the lessons watched longest ago first', () => {
    const items = ['a', 'b', 'c'].map(id => reel(id, 'T'));
    let p = markSeen(EMPTY_PROGRESS, 'a', day(5));
    p = markSeen(p, 'b', day(2));
    p = markSeen(p, 'c', day(7));
    expect(ids(planLearnFeed(items, p, { now }))).toEqual(['b', 'a', 'c']);
  });

  it('counts reels already shown this session as just seen', () => {
    const items = ['a', 'b', 'c'].map(id => reel(id, 'T'));
    expect(ids(planLearnFeed(items, EMPTY_PROGRESS, { now, shown: new Set(['a']) }))).toEqual(['b', 'c', 'a']);
  });

  it('mixes topics: never the same topic twice in a row while another is left', () => {
    const items = [
      ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map(id => reel(id, 'A')),
      ...['b1', 'b2', 'b3'].map(id => reel(id, 'B')),
      ...['c1', 'c2', 'c3'].map(id => reel(id, 'C')),
    ];
    const order = planLearnFeed(items, EMPTY_PROGRESS, { now, seed: 's' });
    expect(order).toHaveLength(items.length);
    order.slice(1).forEach((r, i) => expect(r.topic).not.toBe(order[i].topic));
    // The big topic is spread out, not left for the end.
    expect(order.slice(0, 6).filter(r => r.topic === 'A').length).toBeGreaterThanOrEqual(2);
  });

  it('puts prerequisites and easier levels first within a topic', () => {
    const items = [reel('hard', 'T', 'advanced'), reel('child', 'T'), reel('base', 'T')];
    const requires = (c: string) => (c === 'child' ? ['base'] : []);
    expect(ids(planLearnFeed(items, EMPTY_PROGRESS, { now, requires }))).toEqual(['base', 'child', 'hard']);
  });

  it('never shows a lesson before an unwatched prerequisite, even from another topic', () => {
    const items = [reel('child', 'T'), reel('other', 'T', 'advanced'), reel('base', 'U')];
    // "missing" has no lesson, so it never holds anything back.
    const requires = (c: string) => (c === 'child' ? ['base', 'missing'] : []);
    for (const seed of ['a', 'b', 'c', 'd']) {
      const order = ids(planLearnFeed(items, EMPTY_PROGRESS, { now, requires, seed }));
      expect(order.indexOf('base')).toBeLessThan(order.indexOf('child'));
    }
    const watched = markSeen(EMPTY_PROGRESS, 'base', day(1));
    expect(ids(planLearnFeed(items, watched, { now, requires }))).toEqual(['child', 'other', 'base']);
  });

  it('gives saved topics a bigger share of the feed', () => {
    const items = [
      ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map(id => reel(id, 'A')),
      ...['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].map(id => reel(id, 'B')),
      ...['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map(id => reel(id, 'C')),
    ];
    const countB = (savedTopics: string[]) =>
      planLearnFeed(items, EMPTY_PROGRESS, { now, savedTopics, seed: 's' })
        .slice(0, 9)
        .filter(r => r.topic === 'B').length;
    expect(countB(['B', 'B', 'B'])).toBeGreaterThan(countB([]));
    expect(countB(['B', 'B', 'B', 'B', 'B', 'B'])).toBe(countB(['B', 'B', 'B'])); // capped
  });

  it('is the same for the same seed, and every reel appears once', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => reel(id, `T${i % 3}`));
    const first = planLearnFeed(items, EMPTY_PROGRESS, { now, seed: 'x' });
    expect(ids(planLearnFeed(items, EMPTY_PROGRESS, { now, seed: 'x' }))).toEqual(ids(first));
    expect(new Set(ids(first)).size).toBe(items.length);
  });

  it('mixTopics keeps the order inside each topic', () => {
    const items = [reel('a1', 'A'), reel('a2', 'A'), reel('b1', 'B'), reel('b2', 'B')];
    const order = ids(mixTopics(items, () => 1));
    expect(order.filter(id => id.startsWith('a'))).toEqual(['a1', 'a2']);
    expect(order.filter(id => id.startsWith('b'))).toEqual(['b1', 'b2']);
  });
});

describe('missed questions', () => {
  const all = () => true;
  const p = {
    ...EMPTY_PROGRESS,
    review: {
      b: { due: '2026-01-03', step: 1 },
      a: { due: '2026-01-02', step: 0 },
      later: { due: '2026-01-09', step: 2 },
      gone: { due: '2026-01-01', step: 0 },
    },
  };

  it('returns nothing when no question is back', () => {
    expect(missedQuestionIds(EMPTY_PROGRESS, day(5), all, 20)).toEqual([]);
    expect(missedQuestionIds(p, day(1), id => id !== 'gone', 20)).toEqual([]);
  });

  it('returns the questions back today, longest waiting first, without deleted ones', () => {
    expect(missedQuestionIds(p, day(5), id => id !== 'gone', 20)).toEqual(['a', 'b']);
    expect(missedQuestionIds(p, day(9), all, 20)).toEqual(['gone', 'a', 'b', 'later']);
  });

  it('stops at the limit', () => {
    expect(missedQuestionIds(p, day(9), all, 2)).toEqual(['gone', 'a']);
  });
});

describe('post status', () => {
  const lesson = { id: 'l1', kind: 'learn' as const };
  const quiz = { id: 'q1', kind: 'quiz' as const };

  it('marks lessons new until watched', () => {
    expect(postStatus(EMPTY_PROGRESS, lesson, day(1))).toBe('new');
    expect(postStatus(markSeen(EMPTY_PROGRESS, 'l1', day(1)), lesson, day(1))).toBe('watched');
  });

  it('follows the last answer of a question, and its review day', () => {
    expect(postStatus(EMPTY_PROGRESS, quiz, day(1))).toBe('new');
    expect(postStatus(answerQuiz(EMPTY_PROGRESS, 'q1', true, day(1)), quiz, day(1))).toBe('right');
    const wrong = answerQuiz(EMPTY_PROGRESS, 'q1', false, day(1));
    expect(postStatus(wrong, quiz, day(1))).toBe('missed');
    expect(postStatus(wrong, quiz, day(2))).toBe('back');
  });

  it('shows XP only for new posts and questions back today', () => {
    expect(postXp('learn', 'new')).toBe(5);
    expect(postXp('quiz', 'new')).toBe(10);
    expect(postXp('quiz', 'back')).toBe(5);
    expect(postXp('learn', 'watched')).toBeNull();
    expect(postXp('quiz', 'missed')).toBeNull();
  });
});
