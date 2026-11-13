import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AppLovinMAX from 'react-native-applovin-max';
import { env } from '../../config/env';
import { useIsPro } from '../pro';
import { useRemoteConfig } from '../remoteConfig';

type AdsContextValue = {
  /** Should feeds contain ad slots at all? False for Pro users, when the admin turned ads off, and when no SDK key is set. */
  enabled: boolean;
  /** True once the AppLovin SDK is ready to load real ads. */
  sdkReady: boolean;
  /** No SDK key yet: show labelled sample ads so placement can be reviewed. */
  placeholder: boolean;
  /** Slots the user hid, or whose ad failed to load, per feed. */
  isRemoved: (feed: string, slotId: string) => boolean;
  remove: (feed: string, slotId: string) => void;
};

const AdsContext = createContext<AdsContextValue | null>(null);
const hasKey = env.applovinSdkKey.length > 0 && env.nativeAdUnitId.length > 0;

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const isPro = useIsPro();
  const allowed = useRemoteConfig('adsEnabled') && !isPro;
  const [sdkReady, setSdkReady] = useState(false);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!hasKey || !allowed) {
      return;
    }
    let cancelled = false;
    AppLovinMAX.initialize(env.applovinSdkKey)
      .then(() => {
        if (!cancelled) {
          AppLovinMAX.setMuted(true);
          setSdkReady(true);
        }
      })
      .catch(() => undefined); // No ads this session; the app works the same without them.
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  const remove = useCallback((feed: string, slotId: string) => {
    setRemoved(prev => new Set(prev).add(`${feed}:${slotId}`));
  }, []);

  const value = useMemo<AdsContextValue>(() => {
    const placeholder = env.adPlaceholders && !hasKey;
    return {
      enabled: allowed && (placeholder || (hasKey && sdkReady)),
      sdkReady,
      placeholder,
      isRemoved: (feed, slotId) => removed.has(`${feed}:${slotId}`),
      remove,
    };
  }, [allowed, sdkReady, removed, remove]);

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsContextValue {
  const ctx = useContext(AdsContext);
  if (!ctx) {
    throw new Error('useAds must be used inside <AdsProvider>');
  }
  return ctx;
}
