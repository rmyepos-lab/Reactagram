import { createStore, useStore } from '../../lib/createStore';
import { licenseService, type LicenseResult } from './licenseService';

export { LICENSE_MESSAGES, type LicenseResult } from './licenseService';

type ProState = { key: string | null; active: boolean; validatedAt: string | null };

const REVALIDATE_AFTER_MS = 7 * 86_400_000;
const store = createStore<ProState>(
  { key: null, active: false, validatedAt: null },
  'hookd.pro.v1',
);

export const pro = {
  async activate(rawKey: string): Promise<LicenseResult> {
    const key = rawKey.trim();
    if (!key) {
      return { ok: false, reason: 'invalid' };
    }
    const result = await licenseService.activate(key);
    if (result.ok) {
      store.set({ key, active: true, validatedAt: new Date().toISOString() });
    }
    return result;
  },

  /** Re-check the saved key now and then. Pro is only removed when the key is rejected. */
  async revalidateIfStale(): Promise<void> {
    await store.ready;
    const { key, active, validatedAt } = store.get();
    if (!key || !active) {
      return;
    }
    const age = validatedAt ? Date.now() - new Date(validatedAt).getTime() : Infinity;
    if (age < REVALIDATE_AFTER_MS) {
      return;
    }
    const result = await licenseService.validate(key);
    if (result.ok) {
      store.set(s => ({ ...s, validatedAt: new Date().toISOString() }));
    } else if (result.reason === 'invalid') {
      store.set({ key: null, active: false, validatedAt: null });
    }
  },
};

export const useIsPro = () => useStore(store, s => s.active);
