/**
 * Build-time values. CI overwrites this file from repository secrets (scripts/write-env.ts).
 * Keep the committed copy without keys: with no SDK key there are no real ads.
 */
export const env = {
  applovinSdkKey: '',
  nativeAdUnitId: '',
  /** Without a key, show labelled sample ads so ad placement can be reviewed. */
  adPlaceholders: true,
} as const;
