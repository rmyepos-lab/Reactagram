import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, IconButton } from '../../components/ui';
import { colors, fonts, radii } from '../../theme';
import { NativeAdFrame } from './NativeAdFrame';

type Props = { feed: string; slotId: string; onOptions: () => void };

/** Sponsored card for the Home feed. Same shape as a normal post, clearly labelled. */
export function SponsoredPost({ feed, slotId, onOptions }: Props) {
  return (
    <View style={styles.card}>
      <NativeAdFrame feed={feed} slotId={slotId}>
        {({ Icon, Advertiser, Title, Body, Media, Cta }) => (
          <>
            <View style={styles.head}>
              <Icon style={styles.icon} />
              <Advertiser style={styles.advertiser} numberOfLines={1} />
              <View style={styles.badge}>
                <AppText weight="extrabold" size={12} color={colors.textVariant}>
                  Sponsored
                </AppText>
              </View>
              <View style={styles.optionsSpace} />
            </View>
            <Media style={styles.media} />
            <View style={styles.text}>
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
        color={colors.textVariant}
        onPress={onOptions}
        style={styles.options}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingVertical: 6 },
  icon: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: colors.containerHigh },
  advertiser: { flexShrink: 1, fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.containerHigh,
  },
  optionsSpace: { width: 48, height: 48, marginLeft: 'auto' },
  options: { position: 'absolute', right: 4, top: 6 },
  media: { height: 180, marginHorizontal: 14, borderRadius: radii.lg, backgroundColor: colors.container, overflow: 'hidden' },
  text: { padding: 14, gap: 6 },
  title: { fontFamily: fonts.black, fontSize: 16, lineHeight: 21, color: colors.text },
  body: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textVariant },
  cta: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: radii.md,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: fonts.black,
    fontSize: 15,
    color: colors.white,
    backgroundColor: colors.ink,
  },
});
