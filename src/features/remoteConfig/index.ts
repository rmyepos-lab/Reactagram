import { createStore, useStore } from '../../lib/createStore';
import { changedRows, DEFAULT_CONFIG, mergeConfig, type RemoteConfig } from './schema';
import { fetchRows, isConfigured, saveRows, signIn } from './supabase';

export { CONFIG_FIELDS, type ConfigKey, type RemoteConfig } from './schema';

/** The last config from the server is saved on the phone, so the app also works offline. */
const store = createStore<RemoteConfig>(DEFAULT_CONFIG, 'hookd.config.v1');

export const ADMIN_MESSAGES = {
  network: "Couldn't reach the server. Check your connection and try again.",
  denied: 'Not allowed. Check the email and password, and that this account is an admin.',
  invalid: 'The server sent an unexpected answer. Try again.',
} as const;

export const remoteConfig = {
  /** False until Supabase keys are set in the build: the app then uses its defaults. */
  isConfigured,

  /** Fetch the latest values. Failing is fine: the saved or default values stay in use. */
  async refresh(): Promise<boolean> {
    if (!isConfigured) {
      return false;
    }
    await store.ready;
    const result = await fetchRows();
    if (result.ok) {
      store.set(mergeConfig(DEFAULT_CONFIG, result.data));
    }
    return result.ok;
  },

  signIn,

  /** Admin only: save the edited values for every user. */
  async save(token: string, next: RemoteConfig) {
    const rows = changedRows(store.get(), next);
    if (rows.length === 0) {
      return { ok: true as const, data: null };
    }
    const result = await saveRows(token, rows);
    if (result.ok) {
      store.set(mergeConfig(store.get(), rows));
    }
    return result;
  },

  get: store.get,
};

export function useRemoteConfig(): RemoteConfig;
export function useRemoteConfig<K extends keyof RemoteConfig>(key: K): RemoteConfig[K];
export function useRemoteConfig<K extends keyof RemoteConfig>(key?: K) {
  return useStore(store, s => (key ? s[key] : s));
}
