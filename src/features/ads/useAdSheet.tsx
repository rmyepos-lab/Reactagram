import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AdOptionsSheet } from './AdOptionsSheet';
import { useAds } from './AdsProvider';

/**
 * State and UI for the ad options menu of one feed.
 * Use `open(slotId)` from a sponsored item and render `sheet` once in the screen.
 */
export function useAdSheet(feed: string) {
  const navigation = useNavigation();
  const { remove } = useAds();
  const [slotId, setSlotId] = useState<string | null>(null);
  const close = useCallback(() => setSlotId(null), []);

  const sheet = (
    <AdOptionsSheet
      visible={slotId !== null}
      onClose={close}
      onHide={() => {
        if (slotId) {
          remove(feed, slotId);
        }
        close();
      }}
      onActivateKey={() => {
        close();
        navigation.navigate('Tabs', { screen: 'Profile' });
      }}
    />
  );
  return { open: setSlotId, sheet };
}
