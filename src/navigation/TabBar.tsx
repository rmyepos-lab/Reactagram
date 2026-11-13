import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText, Icon, PressableScale, type IconName } from '../components/ui';
import { colors, durations, layout, radii, reel, springs } from '../theme';
import type { TabParamList } from './types';

const ICONS: Record<keyof TabParamList, IconName> = {
  Home: 'home',
  Explore: 'explore',
  Learn: 'learn',
  Quiz: 'quiz',
  Profile: 'profile',
};
/** Tabs shown on a dark bar, to match the dark reel feed. */
const DARK_TABS: ReadonlySet<string> = new Set(['Learn']);
const PILL_WIDTH = 64;

/** Bottom navigation: 80dp tall, labels, and a pill that slides to the active tab. */
export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const tabWidth = width / state.routes.length;
  const dark = DARK_TABS.has(state.routes[state.index].name);

  const pillX = useSharedValue(0);
  const darkness = useSharedValue(dark ? 1 : 0);

  useEffect(() => {
    if (tabWidth > 0) {
      pillX.value = withSpring(
        state.index * tabWidth + (tabWidth - PILL_WIDTH) / 2,
        springs.gentle,
      );
    }
  }, [state.index, tabWidth, pillX]);

  useEffect(() => {
    darkness.value = withTiming(dark ? 1 : 0, { duration: durations.base });
  }, [dark, darkness]);

  const bar = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(darkness.value, [0, 1], [colors.container, reel.background]),
  }));
  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    backgroundColor: interpolateColor(darkness.value, [0, 1], [colors.primaryContainer, reel.topicChip]),
  }));

  const activeColor = dark ? colors.primaryContainer : colors.onPrimaryContainer;
  const idleColor = dark ? reel.muted : colors.textVariant;

  return (
    <Animated.View
      accessibilityRole="tablist"
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={[styles.bar, { height: layout.tabBarHeight + insets.bottom, paddingBottom: insets.bottom }, bar]}
    >
      {width > 0 ? <Animated.View style={[styles.pill, pill]} /> : null}
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        const name = route.name as keyof TabParamList;
        const color = focused ? activeColor : idleColor;
        return (
          <PressableScale
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={name}
            accessibilityState={{ selected: focused }}
            pressedScale={0.92}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={styles.tab}
          >
            <View style={styles.iconBox}>
              <Icon name={ICONS[name]} color={color} filled={focused && name === 'Learn'} />
            </View>
            <AppText weight={focused ? 'extrabold' : 'bold'} size={12} color={color}>
              {name}
            </AppText>
          </PressableScale>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row' },
  tab: { flex: 1, height: layout.tabBarHeight, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconBox: { width: PILL_WIDTH, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: {
    position: 'absolute',
    top: (layout.tabBarHeight - 32 - 4 - 16) / 2,
    left: 0,
    width: PILL_WIDTH,
    height: 32,
    borderRadius: radii.full,
  },
});
