import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type Store<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  /** Resolves once the saved value has been read from the phone. */
  ready: Promise<void>;
};

/**
 * Tiny external store. With `persistKey` it loads from AsyncStorage on start and saves on
 * every change. Storage errors never crash the app: it keeps working in memory.
 */
export function createStore<T extends object>(initial: T, persistKey?: string): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());

  const ready = persistKey
    ? AsyncStorage.getItem(persistKey)
        .then(raw => {
          if (raw) {
            state = { ...initial, ...(JSON.parse(raw) as Partial<T>) };
            emit();
          }
        })
        .catch(() => undefined)
    : Promise.resolve();

  return {
    ready,
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? next(state) : next;
      if (value === state) {
        return;
      }
      state = value;
      emit();
      if (persistKey) {
        AsyncStorage.setItem(persistKey, JSON.stringify(state)).catch(() => undefined);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Subscribe a component to a store, or to one derived value of it. */
export function useStore<T>(store: Store<T>): T;
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S;
export function useStore<T, S>(store: Store<T>, selector?: (state: T) => S) {
  const read = () => (selector ? selector(store.get()) : store.get());
  return useSyncExternalStore(store.subscribe, read, read);
}
