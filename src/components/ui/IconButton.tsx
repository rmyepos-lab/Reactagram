import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { layout } from '../../theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  icon: IconName;
  /** Required: icon-only buttons need a spoken name. */
  label: string;
  onPress: () => void;
  color?: string;
  background?: string;
  size?: number;
  iconSize?: number;
  filled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Round icon-only button with a 48dp touch target. */
export function IconButton({
  icon,
  label,
  onPress,
  color,
  background = 'transparent',
  size = layout.minTouch,
  iconSize = 24,
  filled,
  selected,
  style,
}: Props) {
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      pressedScale={0.88}
      hitSlop={size < layout.minTouch ? (layout.minTouch - size) / 2 : 0}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={color} filled={filled} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
