/**
 * Build-time values. CI overwrites this file from repository secrets (scripts/write-env.ts).
 * Keep the committed copy without keys: with no SDK key there are no real ads, and with no
 * Supabase values the app uses its built-in settings and hides the admin screen.
 */
export const env = {
  applovinSdkKey: '',
  nativeAdUnitId: '',
  /** Without a key, show labelled sample ads so ad placement can be reviewed. */
  adPlaceholders: true,
  /** Supabase project URL and anon (public) key. Never the service_role key. */
  supabaseUrl: '',
  supabaseAnonKey: '',
};
