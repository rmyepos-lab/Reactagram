import React from 'react';
import { Text, View, type ImageProps, type TextProps, type ViewProps } from 'react-native';
import {
  AdvertiserView,
  BodyView,
  CallToActionView,
  IconView,
  MediaView,
  TitleView,
} from 'react-native-applovin-max';

/**
 * The building blocks of a native ad. Layouts are written once against this shape:
 * `realParts` are filled by AppLovin, `placeholderParts` show sample text until an SDK key is set.
 */
export type AdParts = {
  Title: React.ComponentType<TextProps>;
  Advertiser: React.ComponentType<TextProps>;
  Body: React.ComponentType<TextProps>;
  Cta: React.ComponentType<TextProps>;
  Icon: React.ComponentType<Omit<ImageProps, 'source'>>;
  Media: React.ComponentType<ViewProps>;
};

export const realParts: AdParts = {
  Title: TitleView,
  Advertiser: AdvertiserView,
  Body: BodyView,
  Cta: CallToActionView,
  Icon: IconView,
  Media: MediaView,
};

const sample = (text: string) =>
  function SampleText(props: TextProps) {
    return <Text {...props}>{text}</Text>;
  };

export const placeholderParts: AdParts = {
  Title: sample('Sample ad'),
  Advertiser: sample('Advertiser'),
  Body: sample('A real AppLovin MAX native ad appears here once the SDK key is set.'),
  Cta: sample('Learn more'),
  Icon: ({ style }) => <View style={style as ViewProps['style']} />,
  Media: props => <View {...props} />,
};
