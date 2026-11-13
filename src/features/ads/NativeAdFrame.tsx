import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { NativeAdView } from 'react-native-applovin-max';
import { env } from '../../config/env';
import { placeholderParts, realParts, type AdParts } from './adParts';
import { useAds } from './AdsProvider';

type Props = {
  /** Which feed the slot is in, and its id: used to drop the slot if the ad fails. */
  feed: string;
  slotId: string;
  style?: StyleProp<ViewStyle>;
  children: (parts: AdParts) => React.ReactNode;
};

/**
 * Wraps a sponsored layout. It loads a real native ad when the SDK is ready, or renders
 * the same layout with sample text while no SDK key is set.
 * If the ad can't load, the slot is removed from the feed instead of showing a hole.
 */
export function NativeAdFrame({ feed, slotId, style, children }: Props) {
  const { placeholder, sdkReady, remove } = useAds();

  if (placeholder) {
    return <View style={style}>{children(placeholderParts)}</View>;
  }
  if (!sdkReady) {
    return null;
  }
  return (
    <NativeAdView
      adUnitId={env.nativeAdUnitId}
      placement={feed}
      style={style}
      onAdLoadFailed={() => remove(feed, slotId)}
    >
      {children(realParts)}
    </NativeAdView>
  );
}
