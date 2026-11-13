import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, IconButton } from '../../components/ui';
import { fonts, radii, reel as palette } from '../../theme';
import { NativeAdFrame } from './NativeAdFrame';

type Props = { feed: string; slotId: string; onOptions: () => void };

/** Full-screen sponsored reel that sits inside the stream. One swipe skips it. */
export function SponsoredReel({ feed, slotId, onOptions }: Props) {
  return (
    <View style={styles.card}>
      <NativeAdFrame feed={feed} slotId={slotId} style={styles.fill}>
        {({ Media, Icon, Advertiser, Title, Body, Cta }) => (
          <>
            <Media style={styles.media} />
            <View style={styles.info}>
              <View style={styles.who}>
                <Icon style={styles.icon} />
                <Advertiser style={styles.advertiser} numberOfLines={1} />
                <View style={styles.badge}>
                  <AppText weight="extrabold" size={12} color={palette.chipText}>
                    Sponsored
                  </AppText>
                </View>
              </View>
              <Title style={styles.title} numberOfLines={2} />
              <Body style={styles.body} numberOfLines={2} />
              <Cta style={styles.cta} numberOfLines={1} />
            </View>
          </>
        )}
      </NativeAdFrame>
      <IconButton
        icon="more"
        label="Ad options: hide ad, why this ad"
        color={palette.text}
        background={palette.chip}
        onPress={onOptions}
        style={styles.options}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: palette.background },
  fill: { flex: 1 },
  media: { ...StyleSheet.absoluteFill, backgroundColor: palette.codeAlt },
  info: { position: 'absolute', left: 16, right: 76, bottom: 22, gap: 8 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: palette.chip },
  advertiser: { flexShrink: 1, fontFamily: fonts.black, fontSize: 15, color: palette.text },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: palette.chip,
  },
  title: { fontFamily: fonts.black, fontSize: 18, lineHeight: 23, color: palette.text },
  body: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: palette.textSoft },
  cta: {
    minHeight: 48,
    borderRadius: radii.md,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: fonts.black,
    fontSize: 15,
    color: palette.background,
    backgroundColor: palette.text,
  },
  options: { position: 'absolute', right: 10, bottom: 28 },
});
