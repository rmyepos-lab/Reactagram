import { createStore, useStore } from '../../lib/createStore';
import * as logic from './logic';
import { EMPTY_PROGRESS, type Progress } from './logic';

const store = createStore<Progress>(EMPTY_PROGRESS, 'hookd.progress.v1');

/** Every way the app changes the learner's progress. */
export const progress = {
  store,
  get: store.get,
  markSeen: (id: string) => store.set(p => logic.markSeen(p, id, new Date())),
  addSeconds: (seconds: number) => store.set(p => logic.addSeconds(p, seconds, new Date())),
  toggleLike: (id: string) => store.set(p => logic.toggleLike(p, id)),
  toggleSave: (id: string) => store.set(p => logic.toggleSave(p, id)),
  answer: (id: string, correct: boolean) =>
    store.set(p => logic.answerQuiz(p, id, correct, new Date())),
};

const identity = (p: Progress) => p;

/** Read progress in a component. Pass a selector that returns a stable value. */
export function useProgress(): Progress;
export function useProgress<S>(selector: (p: Progress) => S): S;
export function useProgress<S>(selector?: (p: Progress) => S) {
  return useStore(store, (selector ?? identity) as (p: Progress) => S | Progress);
}
