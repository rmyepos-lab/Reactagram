import React from 'react';
import { StatusBar, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '../../theme';

type Props = {
  children: React.ReactNode;
  /** Dark screens (reels) use light status-bar icons. */
  dark?: boolean;
  background?: string;
  style?: StyleProp<ViewStyle>;
};

/** Page wrapper: background, top safe area, and the right status-bar icon color. */
export function Screen({ children, dark = false, background = colors.surface, style }: Props) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  return (
    <View style={[styles.screen, { backgroundColor: background, paddingTop: insets.top }, style]}>
      {focused ? (
        <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
