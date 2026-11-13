import { createStore, useStore } from '../../lib/createStore';

type Settings = { muted: boolean };

const store = createStore<Settings>({ muted: false }, 'hookd.settings.v1');

export const settings = {
  toggleMuted: () => store.set(s => ({ ...s, muted: !s.muted })),
};

export const useMuted = () => useStore(store, s => s.muted);
