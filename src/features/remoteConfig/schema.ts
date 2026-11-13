import { z } from 'zod';
import { CONTACT_EMAIL, CONTACT_WHATSAPP, HELP_URL } from '../../config/app';

/**
 * Settings the admin can change for every user without a new app version.
 * Only public values belong here: anyone can read this table. Never add API secrets.
 */
export const configSchema = z.object({
  /** Master switch for every ad in the app. */
  adsEnabled: z.boolean(),
  /** Off: the Pro card says "Coming soon". On: it shows the key field. */
  proActivationEnabled: z.boolean(),
  helpUrl: z.string(),
  contactEmail: z.string(),
  contactWhatsapp: z.string(),
  /** Public Lemon Squeezy ids, used by the license check once it is built. */
  lemonSqueezyStoreId: z.string(),
  lemonSqueezyProductId: z.string(),
});

export type RemoteConfig = z.infer<typeof configSchema>;
export type ConfigKey = keyof RemoteConfig;

/** What the app uses when the server has no value or cannot be reached. */
export const DEFAULT_CONFIG: RemoteConfig = {
  adsEnabled: true,
  proActivationEnabled: false,
  helpUrl: HELP_URL,
  contactEmail: CONTACT_EMAIL,
  contactWhatsapp: CONTACT_WHATSAPP,
  lemonSqueezyStoreId: '',
  lemonSqueezyProductId: '',
};

type Field = { key: ConfigKey; label: string; hint: string; group: 'Ads' | 'Pro' | 'Support' };

/** Drives the admin screen: add a field here and to the schema, and it becomes editable. */
export const CONFIG_FIELDS: readonly Field[] = [
  { key: 'adsEnabled', label: 'Show ads', hint: 'Off removes every ad for all users.', group: 'Ads' },
  {
    key: 'proActivationEnabled',
    label: 'Pro key activation',
    hint: 'Off shows "Coming soon" on the Pro card.',
    group: 'Pro',
  },
  { key: 'lemonSqueezyStoreId', label: 'Lemon Squeezy store id', hint: 'Public id, not the API key.', group: 'Pro' },
  { key: 'lemonSqueezyProductId', label: 'Lemon Squeezy product id', hint: 'Public id, not the API key.', group: 'Pro' },
  { key: 'helpUrl', label: 'Help website', hint: 'Empty hides the Help row.', group: 'Support' },
  { key: 'contactEmail', label: 'Contact email', hint: 'Inbox used by Contact us.', group: 'Support' },
  { key: 'contactWhatsapp', label: 'WhatsApp number', hint: 'Digits only, with country code.', group: 'Support' },
];

export type ConfigRow = { key: string; value: unknown };

/**
 * Turns server rows into a full config. Unknown keys and values of the wrong type are
 * ignored one by one, so a bad row can never break the app.
 */
export function mergeConfig(base: RemoteConfig, rows: readonly ConfigRow[]): RemoteConfig {
  const next: Record<string, unknown> = { ...base };
  for (const row of rows) {
    const field = configSchema.shape[row.key as ConfigKey];
    if (field && field.safeParse(row.value).success) {
      next[row.key] = row.value;
    }
  }
  return next as RemoteConfig;
}

/** Rows to save: only the keys whose value changed. */
export function changedRows(before: RemoteConfig, after: RemoteConfig): ConfigRow[] {
  return CONFIG_FIELDS.filter(f => before[f.key] !== after[f.key]).map(f => ({
    key: f.key,
    value: typeof after[f.key] === 'string' ? (after[f.key] as string).trim() : after[f.key],
  }));
}
