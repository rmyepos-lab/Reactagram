import { EMPTY_PROGRESS, answerQuiz } from '../src/features/progress/logic';
import {
  ANY_QUIZ,
  QUIZ_SIZE,
  answeredCount,
  buildQuiz,
  correctCount,
  countMatching,
  evaluate,
  gradeOf,
  isFinished,
  pruneSession,
  recordAnswer,
  remainingIds,
  startSession,
  type Level,
} from '../src/features/quizSession/logic';

const day = (d: number) => new Date(2026, 0, d, 12);
const q = (id: string, topic = 'State', level: Level = 'beginner', concept = id) => ({
  id,
  topic,
  level,
  concept,
});
const many = (n: number, topic = 'State', level: Level = 'beginner') =>
  Array.from({ length: n }, (_, i) => q(`${topic}-${level}-${i}`, topic, level));
/** Fixed "random" so the tests are repeatable. */
const noShuffle = () => 0.999;

describe('buildQuiz', () => {
  it('never has more than 20 questions and never repeats one', () => {
    const ids = buildQuiz(many(50), ANY_QUIZ, EMPTY_PROGRESS, day(1));
    expect(ids).toHaveLength(QUIZ_SIZE);
    expect(new Set(ids).size).toBe(QUIZ_SIZE);
  });

  it('keeps only the chosen topics and levels', () => {
    const pool = [...many(30, 'State', 'beginner'), ...many(30, 'Refs', 'beginner'), ...many(30, 'Refs', 'advanced')];
    const ids = buildQuiz(pool, { levels: ['advanced'], topics: ['Refs'] }, EMPTY_PROGRESS, day(1));
    expect(ids).toHaveLength(QUIZ_SIZE);
    expect(ids.every(id => id.startsWith('Refs-advanced'))).toBe(true);
  });

  it('fills a short quiz from the nearest level of the same topics, never other topics', () => {
    const pool = [
      ...many(5, 'Refs', 'beginner'),
      ...many(4, 'Refs', 'intermediate'),
      ...many(30, 'Refs', 'advanced'),
      ...many(30, 'State', 'beginner'),
    ];
    const ids = buildQuiz(pool, { levels: ['beginner'], topics: ['Refs'] }, EMPTY_PROGRESS, day(1));
    expect(ids).toHaveLength(QUIZ_SIZE);
    expect(ids.every(id => id.startsWith('Refs'))).toBe(true);
    expect(ids.filter(id => id.startsWith('Refs-beginner'))).toHaveLength(5);
    expect(ids.filter(id => id.startsWith('Refs-intermediate'))).toHaveLength(4);
  });

  it('is shorter when the topic has too few questions', () => {
    expect(buildQuiz(many(7), ANY_QUIZ, EMPTY_PROGRESS, day(1))).toHaveLength(7);
    expect(buildQuiz(many(7), { levels: [], topics: ['Nope'] }, EMPTY_PROGRESS, day(1))).toEqual([]);
  });

  it('takes due reviews first, then new questions, then the ones answered longest ago', () => {
    const pool = many(30);
    let p = EMPTY_PROGRESS;
    // 0..24 answered right on different days; 29 answered wrong (due the next day).
    for (let i = 0; i < 25; i++) {
      p = answerQuiz(p, pool[i].id, true, day(1 + (i % 5)));
    }
    p = answerQuiz(p, pool[29].id, false, day(6));
    const ids = buildQuiz(pool, ANY_QUIZ, p, day(10), noShuffle);

    expect(ids).toContain(pool[29].id); // due review
    for (const i of [25, 26, 27, 28]) {
      expect(ids).toContain(pool[i].id); // never answered
    }
    // 15 seats left for answered ones: all of day 1, 2 and 3, none of day 5.
    const seenDays = ids.map(id => pool.findIndex(x => x.id === id)).filter(i => i < 25).map(i => 1 + (i % 5));
    expect(seenDays).toHaveLength(15);
    expect(Math.max(...seenDays)).toBe(3);
  });

  it('does not put two questions of one concept back to back when it can avoid it', () => {
    const pool = [q('a1', 'State', 'beginner', 'a'), q('a2', 'State', 'beginner', 'a'), q('b1', 'State', 'beginner', 'b')];
    const ids = buildQuiz(pool, ANY_QUIZ, EMPTY_PROGRESS, day(1), noShuffle);
    expect(ids).toHaveLength(3);
    expect(ids[1]).toBe('b1');
  });
});

describe('quiz session', () => {
  const session = startSession(['a', 'b', 'c'], ANY_QUIZ, day(1));

  it('tracks answers and what is left, so a quiz can be resumed', () => {
    const s = recordAnswer(recordAnswer(session, 'a', true), 'b', false);
    expect(answeredCount(s)).toBe(2);
    expect(correctCount(s)).toBe(1);
    expect(remainingIds(s)).toEqual(['c']);
    expect(isFinished(s)).toBe(false);
    expect(isFinished(recordAnswer(s, 'c', true))).toBe(true);
  });

  it('keeps the first answer and ignores unknown questions', () => {
    const s = recordAnswer(session, 'a', false);
    expect(recordAnswer(s, 'a', true)).toBe(s);
    expect(recordAnswer(s, 'zzz', true)).toBe(s);
  });

  it('drops questions that no longer exist', () => {
    expect(pruneSession(session, () => true)).toBe(session);
    expect(pruneSession(session, id => id !== 'b')?.ids).toEqual(['a', 'c']);
    expect(pruneSession(session, () => false)).toBeNull();
  });
});

describe('countMatching', () => {
  it('counts exact matches only', () => {
    const pool = [...many(3, 'Refs', 'beginner'), ...many(2, 'Refs', 'advanced'), ...many(4, 'State', 'beginner')];
    expect(countMatching(pool, ANY_QUIZ)).toBe(9);
    expect(countMatching(pool, { levels: ['beginner'], topics: ['Refs'] })).toBe(3);
  });
});

describe('evaluate', () => {
  const questions = [
    q('s1', 'State', 'beginner', 'snapshot'),
    q('s2', 'State', 'beginner', 'snapshot'),
    q('s3', 'State', 'advanced', 'updater'),
    q('r1', 'Refs', 'beginner', 'ref-vs-state'),
    q('r2', 'Refs', 'advanced', 'ref-callbacks'),
    q('x1', 'Hooks', 'beginner', 'rules'),
  ];
  let s = startSession(questions.map(x => x.id), ANY_QUIZ, day(1));
  s = recordAnswer(s, 's1', false);
  s = recordAnswer(s, 's2', false);
  s = recordAnswer(s, 's3', true);
  s = recordAnswer(s, 'r1', true);
  s = recordAnswer(s, 'r2', true);
  const result = evaluate(s, questions);

  it('scores the answered questions only', () => {
    expect(result.overall).toEqual({ right: 3, total: 5, grade: 'fair' });
  });

  it('grades each topic, weakest first', () => {
    expect(result.byTopic).toEqual([
      { topic: 'State', right: 1, total: 3, grade: 'weak' },
      { topic: 'Refs', right: 2, total: 2, grade: 'strong' },
    ]);
  });

  it('scores each difficulty that had questions', () => {
    expect(result.byLevel).toEqual([
      { level: 'beginner', right: 1, total: 3, grade: 'weak' },
      { level: 'advanced', right: 2, total: 2, grade: 'strong' },
    ]);
  });

  it('lists the concepts to review', () => {
    expect(result.missedConcepts).toEqual(['snapshot']);
  });

  it('grades by share of right answers', () => {
    expect(gradeOf(4, 5)).toBe('strong');
    expect(gradeOf(1, 2)).toBe('fair');
    expect(gradeOf(0, 0)).toBe('weak');
  });
});
