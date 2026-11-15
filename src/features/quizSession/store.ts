import { createStore, useStore } from '../../lib/createStore';
import { quizReels } from '../content';
import { progress } from '../progress';
import * as logic from './logic';
import { ANY_QUIZ, type QuizConfig, type QuizSession } from './logic';

type State = {
  /** The quiz in progress or just finished. It survives closing the app. */
  active: QuizSession | null;
  /** The last setup choice, offered again next time. */
  lastConfig: QuizConfig;
};

const store = createStore<State>({ active: null, lastConfig: ANY_QUIZ }, 'hookd.quiz.v1');
const known = new Set(quizReels.map(q => q.id));

// After an app update some saved questions may be gone.
store.ready.then(() => {
  const { active } = store.get();
  if (active) {
    const pruned = logic.pruneSession(active, id => known.has(id));
    if (pruned !== active) {
      store.set(s => ({ ...s, active: pruned }));
    }
  }
});

export const quizSession = {
  store,
  get: store.get,
  /** Starts a new quiz. It replaces an unfinished one. Returns false if nothing matches. */
  start(config: QuizConfig): boolean {
    const now = new Date();
    const ids = logic.buildQuiz(quizReels, config, progress.get(), now);
    if (ids.length === 0) {
      return false;
    }
    store.set({ active: logic.startSession(ids, config, now), lastConfig: config });
    return true;
  },
  answer: (id: string, correct: boolean) =>
    store.set(s => (s.active ? { ...s, active: logic.recordAnswer(s.active, id, correct) } : s)),
  clear: () => store.set(s => ({ ...s, active: null })),
};

export function useQuizSession(): State {
  return useStore(store);
}
