import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { TopicArt, topicColors } from './TopicArt';
import { AppText, PressableScale } from './ui';

type Props = {
  label: string;
  /** Width of the whole item; the circle is sized from it. */
  width: number;
  /** A colored ring means there is something new to watch. */
  fresh: boolean;
  onPress: () => void;
};

/** Instagram-style story circle for a topic, with the topic's illustration inside. */
export function StoryRing({ label, width, fresh, onPress }: Props) {
  const ring = Math.min(width - 8, 72);
  const tint = topicColors(label);
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.92}
      accessibilityLabel={`${label} reels${fresh ? ', new lessons' : ''}`}
      style={[styles.story, { width }]}
    >
      <View
        style={[
          styles.ring,
          { width: ring, height: ring, borderRadius: ring / 2 },
          { backgroundColor: fresh ? tint.accent : colors.border },
        ]}
      >
        <View style={[styles.inner, { borderRadius: ring / 2, backgroundColor: tint.fill }]}>
          <TopicArt topic={label} size={Math.round(ring * 0.46)} color={tint.ink} accent={tint.accent} />
        </View>
      </View>
      <AppText weight="bold" size={12} color={colors.textVariant} numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  story: { alignItems: 'center', gap: 6 },
  ring: { padding: 3 },
  inner: {
    flex: 1,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center', lineHeight: 15 },
});
