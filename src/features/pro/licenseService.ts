/**
 * Pro keys are bought outside the app; the app only activates and re-checks them.
 * The payment provider is not chosen yet, so there is no real implementation:
 * add one that implements `LicenseService` and export it as `licenseService`.
 */
export type LicenseResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'network' | 'unavailable' };

export interface LicenseService {
  /** Activate a key on this phone. */
  activate(key: string): Promise<LicenseResult>;
  /** Re-check a key that was activated before. */
  validate(key: string): Promise<LicenseResult>;
}

const notConfigured: LicenseService = {
  activate: async () => ({ ok: false, reason: 'unavailable' }),
  validate: async () => ({ ok: false, reason: 'unavailable' }),
};

export const licenseService: LicenseService = notConfigured;

export const LICENSE_MESSAGES: Record<'invalid' | 'network' | 'unavailable', string> = {
  invalid: "That key didn't work. Check it and try again.",
  network: "Couldn't reach the server. Check your connection and try again.",
  unavailable: "Key activation isn't available yet.",
};
