import React, { useEffect, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { AppText, BottomSheet, ListRow } from '../../components/ui';
import { APP_NAME } from '../../config/app';
import { colors, radii } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onHide: () => void;
  /** Opens Profile, where a Pro key can be activated. */
  onActivateKey: () => void;
};

/**
 * The ••• menu of a sponsored item. Play policy: it may point to key activation,
 * but it must never mention prices or how to buy.
 */
export function AdOptionsSheet({ visible, onClose, onHide, onActivateKey }: Props) {
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowWhy(false);
    }
  }, [visible]);

  return (
    <BottomSheet visible={visible} onClose={onClose} label="Ad options">
      <AppText accessibilityRole="header" weight="black" size={18} style={styles.title}>
        Ad options
      </AppText>
      <ListRow icon="hide" label="Hide this ad" onPress={onHide} />
      <ListRow icon="info" label="Why am I seeing this?" onPress={() => setShowWhy(v => !v)} />
      {showWhy ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.why}>
          <AppText weight="semibold" size={14} leading={1.45} color={colors.textVariant}>
            Ads keep {APP_NAME} free. They appear between lessons, never during one, and never
            next to quiz answers.
          </AppText>
        </Animated.View>
      ) : null}
      <ListRow icon="key" label="Have a Pro key? Activate it" onPress={onActivateKey} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 4 },
  why: { padding: 14, borderRadius: radii.md, backgroundColor: colors.primaryTint },
});
