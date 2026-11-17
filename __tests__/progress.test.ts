import {
  EMPTY_PROGRESS,
  addSeconds,
  answerQuiz,
  isDue,
  markSeen,
  missedQuestionIds,
  orderFeed,
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

describe('orderFeed', () => {
  it('puts the start reel first, then due reviews, unseen, seen', () => {
    const items = ['a', 'b', 'c', 'd'].map(id => ({ id }));
    let p = markSeen(EMPTY_PROGRESS, 'a', day(1));
    p = answerQuiz(p, 'c', false, day(1));
    const order = orderFeed(items, p, day(2), 'd').map(i => i.id);
    expect(order).toEqual(['d', 'c', 'b', 'a']);
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
